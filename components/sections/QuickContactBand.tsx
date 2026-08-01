"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const WHATSAPP_NUMBER = "972552434775";
const CONTACT_EMAIL = "hello@yeyelabs.com";
const CONTACT_PHONE_DISPLAY = "055-243-4775";

/**
 * A deliberately small, quiet touchpoint right after Services — a chance to
 * catch a lead who's ready NOW, without stopping the page's momentum or
 * repeating the full pitch. The real CTA (with the full story) still lives
 * at the end, after Projects — this is just a rectangular strip, not a
 * destination in itself.
 */
export default function QuickContactBand() {
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
            ? `פנייה מהירה מהעמוד הראשי. טלפון ליצירת קשר: ${form.phone}`
            : "פנייה מהירה מהעמוד הראשי",
        }),
      });
      if (!response.ok) throw new Error("contact request failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="px-6 pt-4 pb-32 md:pt-6 md:pb-36">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mx-auto max-w-[820px] rounded-2xl border border-black/8 bg-black/[0.02] px-7 py-8 text-right md:px-10 md:py-10"
      >
        <h3 className="font-display text-2xl leading-snug font-bold text-black md:text-[28px]">
          לא חייבים לדעת בדיוק מה רוצים כדי להתחיל. תשאירו כמה פרטים ונדבר.
        </h3>
        <p className="mt-3 font-body text-[15px] leading-[1.7] text-black/55">
          אחזור אליכם תוך יום עסקים אחד עם כמה שאלות ומחשבות ראשוניות על הפרויקט. בלי מכירות, בלי התחייבות.
        </p>

        {status === "success" ? (
          <p className="mt-6 font-body text-[15px] text-black/60">קיבלתי, תודה! אחזור אליך בהקדם.</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              type="text"
              placeholder="שם מלא"
              value={form.from_name}
              onChange={(e) => setForm({ ...form, from_name: e.target.value })}
              required
            />
            <Input type="tel" placeholder="טלפון" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
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
              className="!border-black !bg-none !bg-black !shadow-none justify-center !py-3"
            >
              {status === "sending" ? "שולח..." : "בואו נדבר"}
            </Button>
          </form>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-black/8 pt-5">
          <div className="flex items-center gap-4 font-body text-[14px] text-black/60">
            <span>{CONTACT_PHONE_DISPLAY}</span>
            <a href={`mailto:${CONTACT_EMAIL}`} className="transition-colors hover:text-black">
              {CONTACT_EMAIL}
            </a>
          </div>
          <Link
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="text-black/40 transition-colors hover:text-black"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </Link>
        </div>

        <p className="mt-4 font-body text-[12px] text-black/40">* בלי ניוזלטרים שאף אחד לא קורא, מבטיח.</p>
      </motion.div>
    </section>
  );
}
