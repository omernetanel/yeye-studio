"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, Database, Lock, Zap, MessageSquare, Paintbrush, Code2, Rocket } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/ui/ScrollToTop";
import ShimmerButton from "@/components/ui/ShimmerButton";

const principles = [
  {
    icon: LayoutDashboard,
    title: "ממשק פשוט",
    description: "מערכת מורכבת לא חייבת להיות קשה לשימוש. בונים ממשקים שאפשר להבין תוך דקות.",
  },
  {
    icon: Database,
    title: "נתונים בזמן אמת",
    description: "מידע עדכני תמיד — הזמנות, לקוחות, ביצועים. הכל במקום אחד, תמיד מסונכרן.",
  },
  {
    icon: Lock,
    title: "אבטחה מלאה",
    description: "הרשאות לפי תפקיד, גיבויים אוטומטיים, וחיבור מוצפן. הנתונים שלך מוגנים.",
  },
  {
    icon: Zap,
    title: "ביצועים גבוהים",
    description: "מערכת שעובדת מהר גם עם אלפי רשומות. בנויה לגדול יחד עם העסק.",
  },
];

const systemTypes = [
  {
    title: "ניהול לקוחות ותורים",
    description: "מערכת לקביעת תורים, מעקב אחרי לקוחות, ושליחת תזכורות אוטומטיות.",
    use: "מתאים כש: יש לך קליניקה, סטודיו, או כל עסק מבוסס פגישות",
  },
  {
    title: "לוח בקרה עסקי",
    description: "גרפים, נתוני מכירות, מלאי ודוחות — כל מה שצריך לקבל החלטות מהירות.",
    use: "מתאים כש: אתה רוצה לראות את המצב העסקי בלחיצה אחת",
  },
  {
    title: "מערכת ניהול פנימית",
    description: "כלי עבודה לצוות — ניהול משימות, לידים, פרויקטים ותקשורת פנימית.",
    use: "מתאים כש: יש לך צוות ואתה רוצה שכולם יעבדו מאותו מקום",
  },
];

export default function DashboardsService() {
  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#0a0a0a", position: "relative", overflow: "hidden" }}>
      <ScrollToTop />

      <motion.div
        animate={{ opacity: [0.2, 0.35, 0.2], scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "fixed", top: "5%", left: "50%", transform: "translateX(-50%)",
          width: "900px", height: "500px",
          background: "radial-gradient(ellipse, rgba(42,51,243,0.3) 0%, transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none", zIndex: 0,
        }}
      />

      <div style={{
        position: "fixed", inset: 0,
        backgroundImage: `linear-gradient(rgba(107,143,248,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(107,143,248,0.04) 1px, transparent 1px)`,
        backgroundSize: "60px 60px", pointerEvents: "none", zIndex: 0,
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 60%, transparent 80%)",
        maskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 60%, transparent 80%)",
      }} />

      {[...Array(20)].map((_, i) => (
        <motion.div key={i}
          animate={{ y: [0, -20, 0], opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 3 + (i % 4), repeat: Infinity, ease: "easeInOut", delay: i * 0.35 }}
          style={{
            position: "fixed", width: i % 3 === 0 ? "3px" : "2px", height: i % 3 === 0 ? "3px" : "2px",
            borderRadius: "50%", backgroundColor: i % 2 === 0 ? "#2a33f3" : "#6B8FF8",
            left: `${5 + (i * 4.8) % 90}%`, top: `${10 + (i * 11) % 80}%`,
            pointerEvents: "none", zIndex: 0,
          }}
        />
      ))}

      <Navbar />

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* Hero */}
        <section style={{ padding: "160px 24px 80px", textAlign: "center", direction: "rtl" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <motion.h1
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              style={{ fontFamily: "'GoogleSans', Arial, sans-serif", fontWeight: 800, fontSize: "clamp(38px, 5vw, 60px)", color: "white", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: "24px" }}
            >
              מערכת ניהול שעובדת
              <br />
              <span style={{ backgroundImage: "linear-gradient(135deg, #2a33f3 0%, #6B8FF8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                בדיוק כמו העסק שלך
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              style={{ fontFamily: "'Assistant', Arial, sans-serif", fontSize: "18px", color: "rgba(255,255,255,0.55)", lineHeight: 1.8, marginBottom: "36px" }}
            >
              דשבורד וכלי ניהול פנימיים שמסדרים את העסק — במקום אחד, בממשק פשוט, בלי להסתמך על גיליונות אקסל.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              style={{ display: "flex", justifyContent: "center" }}
            >
              <ShimmerButton href="/contact" variant="primary">בוא נבנה את המערכת שלך</ShimmerButton>
            </motion.div>
          </div>
        </section>

        {/* What is it */}
        <section style={{ padding: "60px 24px", direction: "rtl" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6 }}
              style={{ fontFamily: "'GoogleSans', Arial, sans-serif", fontWeight: 700, fontSize: "30px", color: "white", marginBottom: "20px" }}>
              מה זה מערכת ניהול?
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, delay: 0.1 }}
              style={{ fontFamily: "'Assistant', Arial, sans-serif", fontSize: "17px", color: "rgba(255,255,255,0.5)", lineHeight: 1.9 }}>
              מערכת ניהול היא כלי עבודה פנימי שבנוי במיוחד לעסק שלך. בניגוד לתוכנות גנריות שצריך להתאים לעצמך, אנחנו בונים בדיוק מה שצריך — לא יותר, לא פחות. התוצאה היא מערכת שכולם בצוות שלך ישתמשו בה כי היא פשוטה ומדויקת.
            </motion.p>
          </div>
        </section>

        {/* Why */}
        <section style={{ padding: "60px 24px", direction: "rtl" }}>
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6 }}
              style={{ fontFamily: "'GoogleSans', Arial, sans-serif", fontWeight: 700, fontSize: "30px", color: "white", marginBottom: "48px", textAlign: "center" }}>
              למה מערכת ניהול היא חובה
            </motion.h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
              {[
                { stat: "4.5h", statLabel: "שעות בשבוע שנחסכות עם ניהול דיגיטלי", text: "עסק שמנהל לקוחות, תורים ומלאי בגיליונות אקסל מבזבז שעות יקרות על עבודה ידנית. מערכת ניהול ייעודית אוטומטית תהליכים, מפחיתה טעויות, ומחזירה לך את הזמן לעסוק בעסק עצמו." },
                { stat: "×2", statLabel: "פחות טעויות עם תהליכים אוטומטיים", text: "העברת מידע ידנית בין מערכות שונות היא מקור מספר אחד לטעויות יקרות. מערכת ניהול אחת שמחברת הכל — לקוחות, הזמנות, תשלומים — מבטיחה שהמידע תמיד מדויק ועדכני." },
                { stat: "100%", statLabel: "שקיפות עסקית בזמן אמת", text: "כמה לקוחות חדשים החודש? מה המלאי הנוכחי? איזה שירות הכי פופולרי? עם לוח בקרה ייעודי — התשובות לשאלות האלה נמצאות בלחיצה אחת, לא בחיפוש בגיליונות ומיילים." },
              ].map((item, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.1 }}
                  style={{ display: "flex", alignItems: "center", gap: "48px" }}
                >
                  <div style={{ flexShrink: 0, width: "220px", textAlign: "center" }}>
                    <div style={{ fontFamily: "'GoogleSans', Arial, sans-serif", fontWeight: 800, fontSize: "56px", backgroundImage: "linear-gradient(135deg, #2a33f3 0%, #6B8FF8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1, marginBottom: "8px" }}>{item.stat}</div>
                    <div style={{ fontFamily: "'GoogleSans', Arial, sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.35)", lineHeight: 1.4 }}>{item.statLabel}</div>
                  </div>
                  <div style={{ width: "1px", height: "80px", background: "linear-gradient(to bottom, transparent, rgba(107,143,248,0.4), transparent)", flexShrink: 0 }} />
                  <p style={{ flex: 1, fontFamily: "'Assistant', Arial, sans-serif", fontSize: "17px", color: "rgba(255,255,255,0.55)", lineHeight: 1.85, textAlign: "right" }}>{item.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* System types */}
        <section style={{ padding: "60px 24px", direction: "rtl" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6 }}
              style={{ fontFamily: "'GoogleSans', Arial, sans-serif", fontWeight: 700, fontSize: "30px", color: "white", textAlign: "center", marginBottom: "48px" }}>
              איזה סוג מערכת מתאים לך?
            </motion.h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
              {systemTypes.map((type, i) => (
                <motion.div key={type.title}
                  initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.12 }}
                  style={{ position: "relative", background: "linear-gradient(180deg, rgba(20,20,28,0.75) 0%, rgba(13,13,18,0.85) 100%)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderRadius: "20px", border: "1px solid rgba(107,143,248,0.1)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), inset 0 0 0 1px rgba(107,143,248,0.06)", padding: "28px 24px", display: "flex", flexDirection: "column", gap: "12px", textAlign: "right", overflow: "hidden" }}
                >
                  <div style={{ position: "absolute", bottom: 0, right: 0, width: "150px", height: "150px", background: "radial-gradient(ellipse at 100% 100%, rgba(107,143,248,0.13) 0%, transparent 70%)", pointerEvents: "none" }} />
                  <h3 style={{ fontFamily: "'GoogleSans', Arial, sans-serif", fontWeight: 700, fontSize: "18px", color: "white" }}>{type.title}</h3>
                  <p style={{ fontFamily: "'Assistant', Arial, sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>{type.description}</p>
                  <p style={{ fontFamily: "'GoogleSans', Arial, sans-serif", fontSize: "12.5px", color: "#6B8FF8", marginTop: "4px" }}>{type.use}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section style={{ padding: "60px 24px", direction: "rtl" }}>
          <div style={{ maxWidth: "700px", margin: "0 auto" }}>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6 }}
              style={{ fontFamily: "'GoogleSans', Arial, sans-serif", fontWeight: 700, fontSize: "30px", color: "white", textAlign: "center", marginBottom: "56px" }}>
              איך זה עובד?
            </motion.h2>
            <div style={{ position: "relative" }}>
              <motion.div initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 1.2, ease: "easeInOut", delay: 0.2 }}
                style={{ position: "absolute", right: "50%", top: "24px", bottom: "24px", width: "1px", background: "linear-gradient(to bottom, transparent, rgba(107,143,248,0.4) 20%, rgba(107,143,248,0.4) 80%, transparent)", transformOrigin: "top" }} />
              {[
                { number: "01", icon: MessageSquare, title: "מיפוי תהליכים", description: "יושבים יחד ומבינים איך העסק עובד — אילו נתונים חשובים, אילו תהליכים חוזרים, ואיפה הכי הרבה זמן מתבזבז." },
                { number: "02", icon: Paintbrush, title: "עיצוב הממשק", description: "בונים ממשק שמותאם לאנשים שישתמשו בו — פשוט, ברור, ומהיר. לא צריך הדרכה ארוכה כדי להתחיל." },
                { number: "03", icon: Code2, title: "פיתוח ואינטגרציות", description: "בונים את המערכת עם כל החיבורים הנדרשים — תשלומים, יומן, מייל, ו-WhatsApp. הכל מחובר ועובד." },
                { number: "04", icon: Rocket, title: "השקה והדרכה", description: "מעבירים את הצוות שלך על המערכת עד שכולם מרגישים בנוח. תמיכה מלאה בחודש הראשון." },
              ].map((step, i) => {
                const Icon = step.icon;
                const isRight = i % 2 === 0;
                return (
                  <motion.div key={step.number}
                    initial={{ opacity: 0, x: isRight ? 40 : -40 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.15 }}
                    style={{ display: "flex", alignItems: "center", justifyContent: isRight ? "flex-end" : "flex-start", marginBottom: "40px", position: "relative" }}
                  >
                    <div style={{ width: "44%", background: "linear-gradient(180deg, rgba(20,20,28,0.8) 0%, rgba(13,13,18,0.9) 100%)", backdropFilter: "blur(16px)", border: "1px solid rgba(107,143,248,0.15)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)", borderRadius: "16px", padding: "20px 22px", display: "flex", flexDirection: "column", gap: "10px", textAlign: isRight ? "right" : "left" }}>
                      <span style={{ fontFamily: "'GoogleSans', Arial, sans-serif", fontSize: "11px", color: "#6B8FF8", letterSpacing: "0.08em" }}>{step.number}</span>
                      <h3 style={{ fontFamily: "'GoogleSans', Arial, sans-serif", fontWeight: 700, fontSize: "15px", color: "white" }}>{step.title}</h3>
                      <p style={{ fontFamily: "'Assistant', Arial, sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>{step.description}</p>
                    </div>
                    <div style={{ position: "absolute", right: "calc(50% - 16px)", width: "32px", height: "32px", borderRadius: "50%", background: "rgba(42,51,243,0.2)", border: "1px solid rgba(107,143,248,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1, boxShadow: "0 0 12px rgba(42,51,243,0.3)" }}>
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
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6 }}
              style={{ fontFamily: "'GoogleSans', Arial, sans-serif", fontWeight: 700, fontSize: "30px", color: "white", textAlign: "center", marginBottom: "48px" }}>
              העקרונות שלנו
            </motion.h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
              {principles.map((p, i) => {
                const Icon = p.icon;
                return (
                  <motion.div key={p.title}
                    initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.1 }}
                    style={{ position: "relative", background: "linear-gradient(180deg, rgba(20,20,28,0.75) 0%, rgba(13,13,18,0.85) 100%)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderRadius: "20px", border: "1px solid rgba(107,143,248,0.1)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)", padding: "28px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", textAlign: "center", overflow: "hidden" }}
                  >
                    <div style={{ position: "absolute", bottom: 0, right: 0, width: "150px", height: "150px", background: "radial-gradient(ellipse at 100% 100%, rgba(107,143,248,0.13) 0%, transparent 70%)", pointerEvents: "none" }} />
                    <div style={{ width: "52px", height: "52px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle at 30% 30%, rgba(42,51,243,0.35) 0%, rgba(20,20,30,0.4) 75%)", border: "1px solid rgba(107,143,248,0.25)", boxShadow: "0 0 18px rgba(42,51,243,0.35), inset 0 1px 1px rgba(255,255,255,0.15)" }}>
                      <Icon size={24} strokeWidth={1.5} color="#6B8FF8" style={{ filter: "drop-shadow(0 0 6px rgba(42,51,243,0.7))" }} />
                    </div>
                    <h3 style={{ fontFamily: "'GoogleSans', Arial, sans-serif", fontWeight: 700, fontSize: "15px", color: "white" }}>{p.title}</h3>
                    <p style={{ fontFamily: "'Assistant', Arial, sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: 1.65 }}>{p.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* What you get */}
        <section style={{ padding: "60px 24px", direction: "rtl" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6 }} style={{ textAlign: "center", marginBottom: "56px" }}>
              <h2 style={{ fontFamily: "'GoogleSans', Arial, sans-serif", fontWeight: 700, fontSize: "30px", color: "white", marginBottom: "12px" }}>וזה לא הכל</h2>
              <p style={{ fontFamily: "'Assistant', Arial, sans-serif", fontSize: "16px", color: "rgba(255,255,255,0.45)" }}>כל פרויקט מגיע עם שכבת שירות שמעטים מציעים</p>
            </motion.div>
            <div style={{ display: "flex", flexDirection: "column", gap: "56px" }}>
              {[
                [
                  { number: "01", title: "הדרכת צוות מלאה", description: "לא מעבירים לך מערכת ונעלמים. מדריכים את כל הצוות עד שכולם עובדים בביטחון ובמהירות." },
                  { number: "02", title: "זמינות אמיתית", description: "שאלה, בעיה, או פיצ'ר חדש — אנחנו כאן. תמיד תדע עם מי אתה מדבר ומי אחראי למערכת שלך." },
                ],
                [
                  { number: "03", title: "ליווי טכני מקצה לקצה", description: "שרת, דומיין, גיבויים, אבטחה — מסדרים הכל. לא צריך להיות מהנדס כדי להפעיל מערכת מקצועית." },
                  { number: "04", title: "תמיכה לאחר ההשקה", description: "חודש תמיכה מלאה אחרי ההשקה. תיקונים, שיפורים ושאלות — אנחנו שם כדי לוודא שהמערכת עובדת מושלם." },
                ],
              ].map((row, rowIndex) => (
                <motion.div key={rowIndex} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, ease: "easeOut", delay: rowIndex * 0.15 }}
                  style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px" }}>
                  {row.map((item) => (
                    <div key={item.number} style={{ display: "flex", gap: "20px", alignItems: "flex-start", textAlign: "right" }}>
                      <span style={{ fontFamily: "'GoogleSans', Arial, sans-serif", fontWeight: 800, fontSize: "44px", color: "rgba(42,51,243,0.2)", lineHeight: 1, flexShrink: 0, marginTop: "2px" }}>{item.number}</span>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontFamily: "'GoogleSans', Arial, sans-serif", fontWeight: 700, fontSize: "20px", color: "white", marginBottom: "12px" }}>{item.title}</h3>
                        <p style={{ fontFamily: "'Assistant', Arial, sans-serif", fontSize: "16px", color: "rgba(255,255,255,0.5)", lineHeight: 1.85 }}>{item.description}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Examples */}
        <section style={{ padding: "60px 24px", direction: "rtl" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6 }}
              style={{ fontFamily: "'GoogleSans', Arial, sans-serif", fontWeight: 700, fontSize: "30px", color: "white", textAlign: "center", marginBottom: "64px" }}>
              דוגמאות מהעבודה שלנו
            </motion.h2>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}
              style={{ position: "relative", height: "340px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {[
                { label: "מערכת ניהול 01", x: "-105%", delay: 0.1 },
                { label: "מערכת ניהול 02", x: "0%", delay: 0 },
                { label: "מערכת ניהול 03", x: "105%", delay: 0.2 },
              ].map((item, i) => (
                <motion.div key={i}
                  variants={{ hidden: { opacity: 0, x: "0%", scale: 0.85 }, visible: { opacity: 1, x: item.x, scale: 1, transition: { duration: 0.8, ease: [0.34, 1.2, 0.64, 1], delay: item.delay } } }}
                  style={{ position: "absolute", width: "320px", height: "240px", borderRadius: "16px", backgroundColor: "#0f0f14", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <div style={{ height: "32px", backgroundColor: "#111118", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", padding: "0 12px", gap: "6px", flexShrink: 0 }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#ff5f57" }} />
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#febc2e" }} />
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#28c840" }} />
                  </div>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "8px" }}>
                    <span style={{ fontFamily: "'GoogleSans', Arial, sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.15)" }}>{item.label}</span>
                    <span style={{ fontFamily: "'GoogleSans', Arial, sans-serif", fontSize: "11px", color: "rgba(107,143,248,0.3)" }}>בקרוב</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section style={{ padding: "100px 24px", textAlign: "center", direction: "rtl" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6 }}>
            <h2 style={{ fontFamily: "'GoogleSans', Arial, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 4vw, 42px)", color: "white", marginBottom: "16px" }}>
              רוצה מערכת שעובדת בשבילך?
            </h2>
            <p style={{ fontFamily: "'Assistant', Arial, sans-serif", fontSize: "17px", color: "rgba(255,255,255,0.45)", marginBottom: "32px" }}>
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
