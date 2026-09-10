"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const particles = [...Array(16)].map((_, i) => ({
  size: i % 3 === 0 ? 3 : 2,
  color: i % 2 === 0 ? "#4a4a4a" : "#9a9a9a",
  left: `${8 + ((i * 7.5) % 84)}%`,
  top: `${15 + ((i * 13) % 70)}%`,
  duration: 3 + (i % 4),
  delay: i * 0.4,
}));

export default function CTASection() {
  const [form, setForm] = useState({ from_name: "", phone: "", reply_to: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.from_name || !form.reply_to) return;

    setStatus("sending");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_name: form.from_name,
          reply_to: form.reply_to,
          project_type: "לא צוין",
          business_description: form.phone
            ? `פנייה מסוף העמוד הראשי. טלפון ליצירת קשר: ${form.phone}`
            : "פנייה מסוף העמוד הראשי",
        }),
      });
      if (!response.ok) throw new Error("contact request failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section
      id="cta"
      className="relative overflow-hidden bg-white px-6 pt-40 pb-24 text-right md:ps-24 md:pe-10 md:pt-56 md:pb-32"
    >
      {particles.map((p, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -20, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: p.duration, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
          className="pointer-events-none absolute rounded-full"
          style={{ width: p.size, height: p.size, backgroundColor: p.color, left: p.left, top: p.top }}
        />
      ))}

      {/* Two columns, and in RTL the first of them is the right one — so the
          copy is declared first and the balloons take the left half without
          either needing to be placed. On a phone the grid collapses and they
          stack in the same order. */}
      <div className="relative mx-auto grid w-full max-w-[1400px] items-center gap-14 md:grid-cols-2">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="mb-6 font-display text-sm font-medium tracking-[0.08em] text-accent uppercase"
          >
            מוכנים להתחיל?
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mb-6 font-display text-[clamp(40px,5vw,72px)] leading-[1.1] font-extrabold tracking-tight"
          >
            <span className="text-black">בוא נבנה משהו</span>
            <br />
            <span className="bg-[image:var(--gradient-accent)] bg-clip-text text-transparent">שבאמת עובד.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-10 font-body text-lg text-black/45"
          >
            ייעוץ ראשוני ללא עלות. אשמח לשמוע על הפרויקט שלך.
          </motion.p>

          {/* The form itself, rather than a button through to /contact. Asking
              someone who has just read to the end of the page to load another
              one before they can say anything is a step that buys nothing: the
              fields are three, they fit here, and the page they would have gone
              to has the same three. */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-[620px]"
          >
            {status === "success" ? (
              <p className="font-body text-[15px] text-black/60">קיבלתי, תודה! אחזור אליך בהקדם.</p>
            ) : (
              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 text-right sm:grid-cols-2">
                <Input
                  type="text"
                  placeholder="שם מלא"
                  value={form.from_name}
                  onChange={(e) => setForm({ ...form, from_name: e.target.value })}
                  required
                />
                <Input
                  type="tel"
                  placeholder="טלפון"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <Input
                  type="email"
                  placeholder="דוא״ל"
                  value={form.reply_to}
                  onChange={(e) => setForm({ ...form, reply_to: e.target.value })}
                  required
                />
                <Button
                  type="submit"
                  disabled={status === "sending"}
                  showArrow={false}
                  className="!border-black !bg-none !bg-black !text-white !shadow-none justify-center"
                >
                  {status === "sending" ? "שולח..." : "בוא נתחיל ביחד"}
                </Button>
                {status === "error" && (
                  <p className="font-body text-[14px] text-black/50 sm:col-span-2">
                    משהו השתבש בשליחה. אפשר גם ישירות למייל.
                  </p>
                )}
              </form>
            )}
          </motion.div>
        </div>

        {/* The left half, waiting on the balloons. Empty rather than filled
            with a stand-in: a placeholder image is a thing to forget to
            replace, and the column already earns its place by existing — it is
            what holds the copy to the right half of the page. */}
        <div className="hidden md:block" />
      </div>
    </section>
  );
}
