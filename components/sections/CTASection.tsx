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
  // idle → shining → done. The glint borrows the line's colour for the length
  // of the sweep and hands it straight back: the gradient is how this line is
  // meant to look, and the shine is something that happens to it once.
  const [shine, setShine] = useState<"idle" | "shining" | "done">("idle");

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
      className="relative overflow-hidden bg-white px-6 pt-16 pb-24 text-center md:ps-[106px] md:pe-10 md:py-28 md:text-right"
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

      {/* ONE ELEMENT, TWO JOBS.
          On a phone it opens the section: full width, above the words, with a
          good deal of air under it. On a desktop the same element becomes the
          section's ground — absolute, covering it, with the form sitting on
          top. It was a block beside the form there for a round, and that turned
          the close into two things with a field of white between them.
          object-left-bottom because that is where the balloons are: cover crops
          whichever axis is long, and anchoring the crop anywhere else throws
          the only thing in the shot away. It never scales UP either — the file
          is 2200 wide against a viewport that is not — so cover only ever
          shrinks it.
          Declared before the copy so the phone stacks it first; on the desktop
          the copy's z-10 keeps it in front whatever the order.
          muted + playsInline is what lets it autoplay at all: a clip with sound
          will not start on its own on any phone, and without playsInline iOS
          takes it fullscreen the moment it plays. */}
      <video
        src="/videos/cta_end.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        className="relative z-0 mb-24 block h-[250px] w-full rounded-2xl object-cover object-left-bottom md:absolute md:inset-0 md:mb-0 md:h-full md:w-full md:origin-bottom-left md:translate-x-[3%] md:scale-[0.82] md:object-cover md:object-left-bottom md:rounded-none"
      />

      {/* The copy, held to a 620px column on the right — the clip runs behind
          the whole section, and this is what keeps the type off the balloons,
          which sit at the left of the frame.
          The eyebrow above the heading is gone: "מוכנים להתחיל?" announced a
          question the heading underneath was already asking, and a line whose
          only job is to introduce the next line is one the page can end
          without. */}
      <div className="relative z-10 mx-auto w-full max-w-[1400px]">
        <div className="mx-auto w-full max-w-[620px] md:ms-0 md:me-auto">
          <motion.h2
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            onViewportEnter={() => setShine((s) => (s === "idle" ? "shining" : s))}
            className="mb-6 font-display text-[clamp(40px,5vw,72px)] leading-[1.1] font-extrabold tracking-tight"
          >
            <span className="text-black">בואו נבנה משהו</span>
            <br />
            {/* The glint is fired from the viewport enter above rather than on
                mount: this is the bottom of the page, and an animation on its
                own clock would be over before the section had been reached.
                The shine's own gradient is only mounted while it is sweeping,
                and the line goes back to the accent gradient the moment it
                ends. Both swaps happen with the band parked off the letters —
                at 92% and 8% it is clear of them — so neither is visible. */}
            <span
              className={
                shine === "shining"
                  ? "heading-shine-accent is-shining"
                  : "bg-[image:var(--gradient-accent)] bg-clip-text text-transparent"
              }
              onAnimationEnd={() => setShine("done")}
            >
              שבאמת עובד.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12 font-body text-m-body text-black/45 md:mb-10 md:text-lg"
          >
            ייעוץ ראשוני ללא עלות. אשמח לשמוע על הפרויקט שלכם.
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
            className="mx-auto max-w-[620px] md:ms-0 md:me-auto md:max-w-[560px]"
          >
            {status === "success" ? (
              <p className="font-body text-m-body text-black/60">קיבלתי, תודה! אחזור אליך בהקדם.</p>
            ) : (
              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 text-right sm:grid-cols-2 sm:gap-3">
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
                  className="text-right"
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
                  className="!border-black !bg-none !bg-black !text-white !shadow-none mt-4 w-auto justify-center justify-self-center !px-12 sm:mt-0 sm:w-full sm:justify-self-stretch sm:!px-8"
                >
                  {status === "sending" ? "שולח..." : "בואו נתחיל ביחד"}
                </Button>
                {status === "error" && (
                  <p className="font-body text-m-small text-black/50 sm:col-span-2">
                    משהו השתבש בשליחה. אפשר גם ישירות למייל.
                  </p>
                )}
              </form>
            )}
          </motion.div>
        </div>

      </div>
    </section>
  );
}
