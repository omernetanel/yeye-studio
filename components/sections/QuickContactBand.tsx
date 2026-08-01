"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const WHATSAPP_NUMBER = "972552434775";

/**
 * A deliberately small, quiet touchpoint right after Services — a chance to
 * catch a lead who's ready NOW, without stopping the page's momentum or
 * repeating the full pitch. The real CTA (with the full story) still lives
 * at the end, after Projects — this is just a rectangular strip, not a
 * destination in itself.
 */
export default function QuickContactBand() {
  const [form, setForm] = useState({ from_name: "", reply_to: "" });
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
          ...form,
          project_type: "לא צוין",
          business_description: "פנייה מהירה מהעמוד הראשי",
        }),
      });
      if (!response.ok) throw new Error("contact request failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="px-6 pt-4 pb-16 md:pt-6 md:pb-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mx-auto flex max-w-[1080px] flex-col items-center justify-between gap-6 rounded-2xl border border-black/8 bg-black/[0.02] px-7 py-8 md:flex-row md:gap-10 md:px-12 md:py-9"
      >
        <p className="shrink-0 text-center font-display text-xl font-bold text-black md:text-right md:text-2xl">
          בואו נתחיל לעבוד על הפרוייקט הבא שלכם, ביחד
        </p>

        {status === "success" ? (
          <p className="font-body text-[15px] text-black/60">קיבלתי, תודה! אחזור אליך בהקדם.</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2.5 sm:flex-row md:w-auto">
            <Input
              type="text"
              placeholder="השם שלך"
              value={form.from_name}
              onChange={(e) => setForm({ ...form, from_name: e.target.value })}
              required
              className="!py-2.5 sm:w-[160px]"
            />
            <Input
              type="text"
              placeholder="אימייל או טלפון"
              value={form.reply_to}
              onChange={(e) => setForm({ ...form, reply_to: e.target.value })}
              required
              className="!py-2.5 sm:w-[190px]"
            />
            <Button
              type="submit"
              disabled={status === "sending"}
              showArrow={false}
              className="!border-black !bg-none !bg-black !shadow-none justify-center !py-2.5"
            >
              {status === "sending" ? "שולח..." : "שלחו לי"}
            </Button>
          </form>
        )}

        <Link
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className="shrink-0 text-black/40 transition-colors hover:text-black"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </Link>
      </motion.div>
    </section>
  );
}
