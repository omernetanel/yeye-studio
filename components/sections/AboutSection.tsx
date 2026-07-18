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
    description: "אתר יפה זה לא מספיק. אנחנו בונים כלי מכירה שמייצרים תוצאות אמיתיות.",
  },
  {
    icon: Code2,
    title: "Code Quality",
    description: "קוד נקי, מהיר וניתן להרחבה. בונים לטווח הארוך, לא רק להשקה.",
  },
  {
    icon: Paintbrush,
    title: "Design-First",
    description: "כל פרויקט מתחיל מעיצוב מדויק. אנחנו לא כותבים שורת קוד לפני שהחזון ברור.",
  },
];

function ValueCardContent({ value }: { value: Value }) {
  const Icon = value.icon;
  return (
    <Card className="flex h-full flex-col items-end gap-3.5">
      <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-primary-light/25 bg-[radial-gradient(circle_at_30%_30%,color-mix(in_srgb,var(--color-primary)_35%,transparent)_0%,rgba(20,20,30,0.4)_75%)]">
        <Icon size={24} strokeWidth={1.5} className="text-primary-light drop-shadow-[0_0_6px_rgba(42,51,243,0.7)]" />
      </div>
      <span className="font-display text-[17px] font-bold text-white">{value.title}</span>
      <div className="h-px w-5 bg-primary-light/50" />
      <p className="font-body text-[13.5px] leading-[1.7] text-white/45">{value.description}</p>
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
    <section id="about" className="px-6 py-16 md:py-20">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeading title="מי אנחנו?" className="mb-12 md:mb-16" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-14 flex flex-col items-stretch gap-10 md:mb-20 md:flex-row md:gap-14"
        >
          {/* Photo placeholder — real photo pending */}
          <div className="flex aspect-[4/3] shrink-0 items-center justify-center rounded-2xl border border-white/6 bg-[#0f0f14] md:aspect-auto md:w-[320px]">
            <span className="font-display text-[13px] tracking-wide text-white/15">תמונה בקרוב</span>
          </div>

          <div className="flex flex-1 flex-col justify-center gap-5">
            <p className="font-body text-[19px] leading-[1.85] text-white/88">
              YEYE LABS נולד מתוך אובססיה לפרטים קטנים ואמונה עמוקה שכל עסק — גדול או קטן — ראוי לנוכחות דיגיטלית{" "}
              <strong className="text-white">ברמה הגבוהה ביותר</strong>.
            </p>
            <p className="font-body text-[19px] leading-[1.85] text-white/88">
              אנחנו מעצבים ומפתחים מגיל צעיר, עם ניסיון של שנים בבניית חוויות דיגיטליות{" "}
              <strong className="text-white">שלא רק נראות טוב — אלא עובדות</strong>. כל פרויקט מקבל את מלוא
              הקשב, הדיוק והאנרגיה שלנו.
            </p>
          </div>
        </motion.div>

        {/* Value cards get the full section width — squeezing them into the
            narrower text column left them cramped. */}
        <SwipeCarousel className="sm:hidden" slideWidth="80%">
          {values.map((value) => (
            <ValueCardContent key={value.title} value={value} />
          ))}
        </SwipeCarousel>

        <div className="hidden gap-6 sm:grid sm:grid-cols-3 lg:gap-8">
          {values.map((value, i) => (
            <ValueCard key={value.title} value={value} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
