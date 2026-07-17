"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/ui/ScrollToTop";

const projectTypes = [
  "חנות אונליין",
  "דף נחיתה",
  "אתר תדמית",
  "מערכת ניהול",
  "אחר",
];

export default function ContactPage() {
  const [form, setForm] = useState({
    from_name: "",
    project_type: "",
    business_description: "",
    timeline: "",
    reply_to: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSubmit = async () => {
    if (!form.from_name || !form.project_type || !form.business_description || !form.reply_to) {
      return;
    }
    setStatus("sending");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error("contact request failed");
      setStatus("success");

      // WhatsApp
      const msg = encodeURIComponent(
        `היי YEYE Studio! אני ${form.from_name}, מחפש ${form.project_type}. ${form.business_description}`
      );
      window.open(`https://wa.me/972552434775?text=${msg}`, "_blank");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <main style={{ minHeight: "100vh", backgroundColor: "#0a0a0a" }}>
        <ScrollToTop />
        <Navbar />
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          direction: "rtl",
          padding: "24px",
        }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ textAlign: "center", maxWidth: "480px" }}
          >
            <div style={{ fontSize: "48px", marginBottom: "24px" }}>✅</div>
            <h1 style={{
              fontFamily: "'GoogleSans', Arial, sans-serif",
              fontWeight: 700,
              fontSize: "36px",
              color: "white",
              marginBottom: "16px",
            }}>
              קיבלנו את הפנייה שלך!
            </h1>
            <p style={{
              fontFamily: "'Assistant', Arial, sans-serif",
              fontSize: "17px",
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.8,
            }}>
              ניצור איתך קשר תוך 48 שעות. בינתיים, פתחנו לך שיחת WhatsApp כדי שנוכל להתחיל לדבר.
            </p>
          </motion.div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#0a0a0a", position: "relative", overflow: "hidden" }}>
      <ScrollToTop />

      {/* Top arc gradient */}
      <div style={{
        position: "fixed",
        top: "-300px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "800px",
        height: "600px",
        borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(42,51,243,0.35) 0%, transparent 70%)",
        filter: "blur(60px)",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* Pulsing glow */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.35, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          position: "fixed",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "400px",
          background: "radial-gradient(ellipse, rgba(42,51,243,0.25) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -24, 0],
            opacity: [0.15, 0.5, 0.15],
          }}
          transition={{
            duration: 3 + (i % 4),
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.35,
          }}
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
      <div style={{
        position: "relative",
        zIndex: 1,
        maxWidth: "680px",
        margin: "0 auto",
        padding: "140px 24px 80px",
        direction: "rtl",
      }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ marginBottom: "56px", textAlign: "center" }}
        >
          <h1 style={{
            fontFamily: "'GoogleSans', Arial, sans-serif",
            fontWeight: 700,
            fontSize: "48px",
            color: "white",
            marginBottom: "16px",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}>
            בוא נבנה משהו גדול
          </h1>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "80px" }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
            style={{
              height: "3px",
              background: "linear-gradient(90deg, #2a33f3, #6B8FF8)",
              borderRadius: "2px",
              margin: "0 auto 24px",
              overflow: "hidden",
            }}
          />
          <p style={{
            fontFamily: "'Assistant', Arial, sans-serif",
            fontSize: "17px",
            color: "rgba(255,255,255,0.55)",
            lineHeight: 1.8,
          }}>
            ספר לנו על הפרויקט שלך ונחזור אליך תוך 48 שעות עם הצעה מותאמת.
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
          style={{ display: "flex", flexDirection: "column", gap: "24px" }}
        >
          {/* Name */}
          <div>
            <label style={{
              display: "block",
              fontFamily: "'GoogleSans', Arial, sans-serif",
              fontSize: "14px",
              color: "rgba(255,255,255,0.6)",
              marginBottom: "8px",
            }}>
              השם שלך *
            </label>
            <input
              type="text"
              placeholder="ישראל ישראלי"
              value={form.from_name}
              onChange={(e) => setForm({ ...form, from_name: e.target.value })}
              style={{
                width: "100%",
                padding: "14px 16px",
                backgroundColor: "#111111",
                border: "1px solid #1e1e1e",
                borderRadius: "10px",
                color: "white",
                fontSize: "15px",
                fontFamily: "'Assistant', Arial, sans-serif",
                outline: "none",
                direction: "rtl",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#2a33f3"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#1e1e1e"; }}
            />
          </div>

          {/* Project Type */}
          <div>
            <label style={{
              display: "block",
              fontFamily: "'GoogleSans', Arial, sans-serif",
              fontSize: "14px",
              color: "rgba(255,255,255,0.6)",
              marginBottom: "8px",
            }}>
              מה אתה מחפש? *
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {projectTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setForm({ ...form, project_type: type })}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border: `1px solid ${form.project_type === type ? "#2a33f3" : "#1e1e1e"}`,
                    backgroundColor: form.project_type === type ? "rgba(42,51,243,0.15)" : "#111111",
                    color: form.project_type === type ? "#6B8FF8" : "rgba(255,255,255,0.55)",
                    fontSize: "14px",
                    fontFamily: "'GoogleSans', Arial, sans-serif",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Business Description */}
          <div>
            <label style={{
              display: "block",
              fontFamily: "'GoogleSans', Arial, sans-serif",
              fontSize: "14px",
              color: "rgba(255,255,255,0.6)",
              marginBottom: "8px",
            }}>
              ספר לנו על העסק שלך *
            </label>
            <textarea
              placeholder="מה העסק עושה? מה המטרה של הפרויקט?"
              value={form.business_description}
              onChange={(e) => setForm({ ...form, business_description: e.target.value })}
              rows={4}
              style={{
                width: "100%",
                padding: "14px 16px",
                backgroundColor: "#111111",
                border: "1px solid #1e1e1e",
                borderRadius: "10px",
                color: "white",
                fontSize: "15px",
                fontFamily: "'Assistant', Arial, sans-serif",
                outline: "none",
                direction: "rtl",
                resize: "vertical",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#2a33f3"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#1e1e1e"; }}
            />
          </div>

          {/* Timeline */}
          <div>
            <label style={{
              display: "block",
              fontFamily: "'GoogleSans', Arial, sans-serif",
              fontSize: "14px",
              color: "rgba(255,255,255,0.6)",
              marginBottom: "8px",
            }}>
              מתי אתה רוצה להשיק?
            </label>
            <input
              type="text"
              placeholder="לדוגמה: בעוד חודשיים, עד סוף השנה..."
              value={form.timeline}
              onChange={(e) => setForm({ ...form, timeline: e.target.value })}
              style={{
                width: "100%",
                padding: "14px 16px",
                backgroundColor: "#111111",
                border: "1px solid #1e1e1e",
                borderRadius: "10px",
                color: "white",
                fontSize: "15px",
                fontFamily: "'Assistant', Arial, sans-serif",
                outline: "none",
                direction: "rtl",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#2a33f3"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#1e1e1e"; }}
            />
          </div>

          {/* Email */}
          <div>
            <label style={{
              display: "block",
              fontFamily: "'GoogleSans', Arial, sans-serif",
              fontSize: "14px",
              color: "rgba(255,255,255,0.6)",
              marginBottom: "8px",
            }}>
              האימייל שלך *
            </label>
            <input
              type="email"
              placeholder="israel@example.com"
              value={form.reply_to}
              onChange={(e) => setForm({ ...form, reply_to: e.target.value })}
              style={{
                width: "100%",
                padding: "14px 16px",
                backgroundColor: "#111111",
                border: "1px solid #1e1e1e",
                borderRadius: "10px",
                color: "white",
                fontSize: "15px",
                fontFamily: "'Assistant', Arial, sans-serif",
                outline: "none",
                direction: "ltr",
                textAlign: "right",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#2a33f3"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#1e1e1e"; }}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={status === "sending"}
            style={{
              width: "100%",
              padding: "16px",
              background: "linear-gradient(160deg, #6B8FF8 0%, #2a33f3 50%, #1e28d4 100%)",
              border: "1px solid rgba(255,255,255,0.15)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)",
              borderRadius: "10px",
              color: "white",
              fontSize: "16px",
              fontFamily: "'GoogleSans', Arial, sans-serif",
              fontWeight: 600,
              cursor: status === "sending" ? "wait" : "pointer",
              marginTop: "8px",
              transition: "transform 0.2s",
              opacity: status === "sending" ? 0.7 : 1,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            {status === "sending" ? "שולח..." : "שלח ונתחיל לדבר ↗"}
          </button>

          {status === "error" && (
            <p style={{
              textAlign: "center",
              color: "#ff5f57",
              fontFamily: "'Assistant', Arial, sans-serif",
              fontSize: "14px",
            }}>
              משהו השתבש. נסה שוב או צור קשר ישירות ב-WhatsApp.
            </p>
          )}
        </motion.div>
      </div>
      <Footer />
    </main>
  );
}
