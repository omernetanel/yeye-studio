"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/ui/ScrollToTop";
import Label from "@/components/ui/Label";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const projectTypes = ["חנות אונליין", "דף נחיתה", "אתר תדמית", "מערכת ניהול", "אחר"];

const particles = [...Array(20)].map((_, i) => ({
  size: i % 3 === 0 ? 3 : 2,
  color: i % 2 === 0 ? "#2a33f3" : "#6B8FF8",
  left: `${5 + ((i * 4.8) % 90)}%`,
  top: `${10 + ((i * 11) % 80)}%`,
  duration: 3 + (i % 4),
  delay: i * 0.35,
}));

export default function ContactPage() {
  const [form, setForm] = useState({
    from_name: "",
    project_type: "",
    business_description: "",
    timeline: "",
    reply_to: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.from_name || !form.project_type || !form.business_description || !form.reply_to) return;

    setStatus("sending");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error("contact request failed");
      setStatus("success");

      const msg = encodeURIComponent(
        `היי YEYE LABS! אני ${form.from_name}, מחפש ${form.project_type}. ${form.business_description}`
      );
      window.open(`https://wa.me/972552434775?text=${msg}`, "_blank");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <main className="min-h-screen bg-background">
        <ScrollToTop />
        <Navbar />
        <div className="flex min-h-screen items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-[480px] text-center"
          >
            <div className="mb-6 text-5xl">✅</div>
            <h1 className="mb-4 font-display text-4xl font-bold text-white">קיבלתי את הפנייה שלך!</h1>
            <p className="font-body text-[17px] leading-[1.8] text-white/55">
              אצור איתך קשר תוך 48 שעות. בינתיים, פתחתי לך שיחת WhatsApp כדי שנוכל להתחיל לדבר.
            </p>
          </motion.div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <ScrollToTop />

      <div
        className="pointer-events-none fixed top-[-300px] left-1/2 z-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full blur-[60px]"
        style={{
          background: "radial-gradient(ellipse, color-mix(in srgb, var(--color-primary) 35%, transparent) 0%, transparent 70%)",
        }}
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none fixed top-[30%] left-1/2 z-0 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[60px]"
        style={{
          background: "radial-gradient(ellipse, color-mix(in srgb, var(--color-primary) 25%, transparent) 0%, transparent 70%)",
        }}
      />
      {particles.map((p, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -24, 0], opacity: [0.15, 0.5, 0.15] }}
          transition={{ duration: p.duration, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
          className="pointer-events-none fixed z-0 rounded-full"
          style={{ width: p.size, height: p.size, backgroundColor: p.color, left: p.left, top: p.top }}
        />
      ))}

      <Navbar />
      <div className="relative z-10 mx-auto max-w-[680px] px-6 pt-[140px] pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-14 text-center"
        >
          <h1 className="mb-4 font-display text-5xl font-bold tracking-tight text-white">בוא נבנה משהו גדול</h1>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "80px" }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
            className="mx-auto mb-6 h-[3px] overflow-hidden rounded-full bg-[image:var(--gradient-brand)]"
          />
          <p className="font-body text-[17px] leading-[1.8] text-white/55">
            ספר לי על הפרויקט שלך ואחזור אליך תוך 48 שעות עם הצעה מותאמת.
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
          className="flex flex-col gap-6"
        >
          <div>
            <Label htmlFor="from_name">השם שלך *</Label>
            <Input
              id="from_name"
              type="text"
              placeholder="ישראל ישראלי"
              value={form.from_name}
              onChange={(e) => setForm({ ...form, from_name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>מה אתה מחפש? *</Label>
            <div className="flex flex-wrap gap-2.5">
              {projectTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm({ ...form, project_type: type })}
                  className={cn(
                    "rounded-lg border px-[18px] py-2.5 font-display text-sm transition-colors",
                    form.project_type === type
                      ? "border-primary bg-primary/15 text-primary-light"
                      : "border-white/10 bg-surface text-white/55 hover:border-white/25"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="business_description">ספר לי על העסק שלך *</Label>
            <Textarea
              id="business_description"
              placeholder="מה העסק עושה? מה המטרה של הפרויקט?"
              rows={4}
              value={form.business_description}
              onChange={(e) => setForm({ ...form, business_description: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="timeline">מתי אתה רוצה להשיק?</Label>
            <Input
              id="timeline"
              type="text"
              placeholder="לדוגמה: בעוד חודשיים, עד סוף השנה..."
              value={form.timeline}
              onChange={(e) => setForm({ ...form, timeline: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="reply_to">האימייל שלך *</Label>
            <Input
              id="reply_to"
              type="email"
              placeholder="israel@example.com"
              dir="ltr"
              className="text-right"
              value={form.reply_to}
              onChange={(e) => setForm({ ...form, reply_to: e.target.value })}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={status === "sending"}
            showArrow={false}
            className="mt-2 w-full justify-center py-4 text-base"
          >
            {status === "sending" ? "שולח..." : "שלח ונתחיל לדבר ↗"}
          </Button>

          {status === "error" && (
            <p className="text-center font-body text-sm text-[#ff5f57]">
              משהו השתבש. נסה שוב או צור קשר ישירות ב-WhatsApp.
            </p>
          )}
        </motion.form>
      </div>
      <Footer />
    </main>
  );
}
