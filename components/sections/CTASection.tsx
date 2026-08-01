"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Label from "@/components/ui/Label";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

const WHATSAPP_NUMBER = "972552434775";

export default function CTASection() {
  const [form, setForm] = useState({ from_name: "", reply_to: "", business_description: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.from_name || !form.reply_to || !form.business_description) return;

    setStatus("sending");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, project_type: "לא צוין" }),
      });
      if (!response.ok) throw new Error("contact request failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="contact" className="relative overflow-hidden px-6 py-20 text-center md:py-28">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative mx-auto h-[220px] w-[220px] md:h-[280px] md:w-[280px]"
      >
        <Image src="/images/paper-ball-settled.png" alt="" fill className="object-contain" priority />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        className="mx-auto mt-8 max-w-[560px] font-display text-[clamp(32px,4.5vw,56px)] leading-[1.15] font-bold text-black"
      >
        בואו נבנה את הפרויקט
        <br />
        הראשון שלכם
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mx-auto mt-4 max-w-[440px] font-body text-lg text-black/50"
      >
        ספרו לי קצת עליכם, ואחזור אליכם עם מחשבות ראשוניות תוך יום-יומיים.
      </motion.p>

      {status === "success" ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto mt-10 max-w-[420px] rounded-2xl border border-black/8 bg-black/[0.02] p-8"
        >
          <p className="font-display text-lg font-bold text-black">קיבלתי, תודה! 🙌</p>
          <p className="mt-2 font-body text-[15px] leading-[1.7] text-black/55">אחזור אליך בהקדם.</p>
        </motion.div>
      ) : (
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mt-10 flex max-w-[420px] flex-col gap-4 text-right"
        >
          <div>
            <Label htmlFor="cta_from_name">השם שלך *</Label>
            <Input
              id="cta_from_name"
              type="text"
              placeholder="ישראל ישראלי"
              value={form.from_name}
              onChange={(e) => setForm({ ...form, from_name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="cta_reply_to">אימייל או טלפון *</Label>
            <Input
              id="cta_reply_to"
              type="text"
              placeholder="israel@example.com"
              value={form.reply_to}
              onChange={(e) => setForm({ ...form, reply_to: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="cta_business_description">קצת על הפרויקט *</Label>
            <Textarea
              id="cta_business_description"
              placeholder="מה תרצו לבנות?"
              rows={3}
              value={form.business_description}
              onChange={(e) => setForm({ ...form, business_description: e.target.value })}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={status === "sending"}
            showArrow={false}
            className="mt-2 w-full justify-center !border-black !bg-none !bg-black !shadow-none py-4 text-base"
          >
            {status === "sending" ? "שולח..." : "שלח"}
          </Button>

          {status === "error" && (
            <p className="text-center font-body text-sm text-[#ff5f57]">משהו השתבש. נסה שוב או צור קשר ב-WhatsApp.</p>
          )}
        </motion.form>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-6"
      >
        <Link
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-display text-sm text-black/50 transition-colors hover:text-black"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          או כתבו לי ב-WhatsApp
        </Link>
      </motion.div>
    </section>
  );
}
