"use client";

import { motion } from "framer-motion";
import { Code2, Paintbrush, Target, type LucideIcon } from "lucide-react";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import SwipeCarousel from "@/components/ui/SwipeCarousel";

interface Value {
  icon: LucideIcon;
  title: string;
  description: string;
}

const values: Value[] = [
  {
    icon: Target,
    title: "Results-Driven",
    description: "אתר יפה זה לא מספיק. אני בונה כלי מכירה שמייצרים תוצאות אמיתיות.",
  },
  {
    icon: Code2,
    title: "Code Quality",
    description: "קוד נקי, מהיר וניתן להרחבה. אני בונה לטווח הארוך, לא רק להשקה.",
  },
  {
    icon: Paintbrush,
    title: "Design-First",
    description: "כל פרויקט מתחיל מעיצוב מדויק. אני לא כותב שורת קוד לפני שהחזון ברור.",
  },
];

function ValueCardContent({ value }: { value: Value }) {
  const Icon = value.icon;
  return (
    <Card light className="!p-5 flex h-full flex-col items-end gap-2.5">
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-accent/25 bg-[radial-gradient(circle_at_30%_30%,color-mix(in_srgb,var(--color-accent)_35%,transparent)_0%,rgba(255,255,255,0.4)_75%)]">
        <Icon size={20} strokeWidth={1.5} className="text-accent drop-shadow-[0_0_6px_rgba(42,51,243,0.35)]" />
      </div>
      <span className="font-display text-[15px] font-bold text-black">{value.title}</span>
      <div className="h-px w-5 bg-accent/50" />
      <p className="font-body text-[13px] leading-[1.65] text-black/50">{value.description}</p>
    </Card>
  );
}

function ValueCard({ value, index }: { value: Value; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1], delay: (2 - index) * 0.3 }}
      className="h-full"
    >
      <ValueCardContent value={value} />
    </motion.div>
  );
}

export default function AboutSection() {
  return (
    <section id="about" className="relative px-6 py-16 md:py-20">
      <div className="relative z-10 mx-auto max-w-[1200px]">
        <SectionHeading title="מי אני?" className="mb-12 md:mb-16" light />

        <div className="flex flex-col items-stretch gap-10 md:flex-row md:gap-14">
          {/* Photo placeholder — real photo pending. Stretches to match the
              text+cards column's full height via items-stretch. */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex aspect-[4/3] shrink-0 items-center justify-center rounded-2xl border border-black/8 bg-black/[0.03] md:aspect-auto md:w-[420px]"
          >
            <span className="font-display text-[13px] tracking-wide text-black/30">תמונה בקרוב</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-1 flex-col justify-center gap-10"
          >
            <div className="flex flex-col gap-5">
              <p className="font-body text-[16px] leading-[1.8] text-black/75">
                YEYE LABS נולד מתוך אובססיה לפרטים קטנים ואמונה עמוקה שכל עסק, גדול או קטן, ראוי לנוכחות דיגיטלית{" "}
                <strong className="text-black">ברמה הגבוהה ביותר</strong>.
              </p>
              <p className="font-body text-[16px] leading-[1.8] text-black/75">
                אני מעצב ומפתח מגיל צעיר, עם ניסיון של שנים בבניית חוויות דיגיטליות{" "}
                <strong className="text-black">שלא רק נראות טוב, אלא עובדות</strong>. כל פרויקט מקבל את מלוא
                הקשב, הדיוק והאנרגיה שלי.
              </p>
            </div>

            <SwipeCarousel className="sm:hidden" slideWidth="80%">
              {values.map((value) => (
                <ValueCardContent key={value.title} value={value} />
              ))}
            </SwipeCarousel>

            <div className="hidden gap-5 sm:grid sm:grid-cols-3">
              {values.map((value, i) => (
                <ValueCard key={value.title} value={value} index={i} />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
