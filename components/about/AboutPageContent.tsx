"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { SITE_NAME } from "@/lib/site";

/**
 * The about page. Plain on purpose: the photograph beside a heading and the
 * text under it, laid across the whole width of the screen.
 *
 * WHAT IT IS NOT, because each was built and turned down:
 * - One long narrow column of headings and paragraphs. However good the
 *   words, a single measure down the middle of a wide screen reads as a long
 *   feature about someone, and this is a one-person studio, not a profile of
 *   a celebrity. The page is laid out in rows that use the width instead,
 *   and the story is short.
 * - Pull quotes. A sentence of the story set large turned an anecdote into a
 *   headline, and the name's explanation reads better as part of its
 *   paragraph than on a line of its own. Emphasis is a highlighter stroke
 *   (.text-marker), inside the text.
 * - A black chapter-per-screen page, a row of facts, a grid of cards.
 *
 * Every claim is the owner's own, or already stated elsewhere on the site: the
 * month of support, teaching clients to edit their content and the one business
 * day are the service pages' and the forms' words. No age, no years of
 * experience and no client counts - see CONTEXT.md.
 */

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

const QUESTIONS = [
  {
    question: "צריך לדעת בדיוק מה רוצים?",
    answer: "לא. מספיק רעיון, או אפילו רק תחושה שמשהו צריך להשתנות. את השאר נגלה יחד בשיחה הראשונה.",
  },
  {
    question: "מה כדאי להכין לפני שמדברים?",
    answer: "שום דבר חובה. אם יש אתרים שאהבתם, רפרנסים, לוגו או חומרים קיימים, מעולה להביא. אם אין, מתחילים מאפס.",
  },
  {
    question: "עובד רק עם עסקים גדולים?",
    answer: "עם קטנים וגדולים. מה שחשוב זה שיש משהו שרוצים לבנות כמו שצריך.",
  },
  {
    question: "מה קורה אחרי שהאתר עולה?",
    answer:
      "אני לא מוסר ונעלם. אחרי ההשקה יש חודש של תמיכה טכנית בלי עלות, אני מלמד אתכם לעדכן תכנים לבד, ותמיד ברור עם מי מדברים.",
  },
  {
    question: "איך מתחילים?",
    answer: "משאירים פרטים או כותבים לי בוואטסאפ, ובדרך כלל אחזור אליכם בתוך יום עסקים אחד.",
  },
];

const HEADING = "font-display text-[26px] leading-[1.2] font-extrabold tracking-tight text-black md:text-[32px]";
const BODY = "font-display text-[18px] leading-[1.75] font-light text-black/75 md:text-[19px]";

/** A block that rises into place once, as it comes up. */
function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  return (
    <motion.div
      className={className}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export default function AboutPageContent() {
  return (
    // Wide, but held in from the edges of the screen.
    <article className="mx-auto max-w-[1400px] px-6 pt-[140px] pb-24 md:px-16 md:pt-[150px]">
      {/* THE OPENING: the photograph beside the heading, and everything the
          page has to say about who this is under it. Nothing here animates, so
          it is there on the first frame. */}
      {/* The text takes the row and the photo a fixed column beside it: no
          measure on the paragraphs, which is what made the page read as a
          narrow feature. */}
      <header className="grid grid-cols-1 items-start gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,340px)] md:gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:gap-20">
        <div>
          <h1 className="font-display text-[44px] leading-[1.05] font-extrabold tracking-tight text-black md:text-[72px] lg:text-[84px]">
            נעים מאוד,
            <br />
            אני עומר.
          </h1>
          <p className={`mt-6 md:mt-8 ${BODY} md:text-[22px]`}>
            מעצב ומפתח אתרים, ומי שעומד מאחורי {SITE_NAME}. אני בונה אתרים מגיל 15, והיום מעצב ובונה אותם מאפס לעסקים קטנים וגדולים, מהרעיון ועד האתר
            שעולה לאוויר.
          </p>

          {/* The story, short, under the introduction and beside the photo:
              laid out below it in a row of its own, the opening was a name and
              a picture on an empty screen. */}
          <div className="mt-10 space-y-8 border-t border-black/10 pt-8 md:mt-12">
            <section>
              <h2 className={HEADING}>איך זה התחיל</h2>
              <p className={`mt-3 ${BODY}`}>
                בגיל 14 נחשפתי לבניית אתרים, ובגיל 15 כבר בניתי את האתרים הראשונים שלי: אתרי מעריצים עם עשרות
                עמודים, ביניהם אתר המעריצים הישראלי של קייטי פרי, ואתר מדריכים שלימד אחרים לעצב ולבנות. עד גיל 17
                כבר הבנתי לעומק איך אתר בנוי מבפנים, מהעיצוב, דרך הקוד ועד השרת שמריץ אותו. במקביל ערכתי וידאו ועיצבתי בפוטושופ. אף אחד לא ביקש ממני,{" "}
                <mark className="text-marker bg-transparent text-inherit">פשוט לא הצלחתי להפסיק.</mark>
              </p>
            </section>
            <section>
              <h2 className={HEADING}>למה YEYE</h2>
              <p className={`mt-3 ${BODY}`}>
                אחרי שנים של עבודה בעולם הטכנולוגי, חזרתי למה שתמיד משך אותי:{" "}
                <mark className="text-marker bg-transparent text-inherit">לעצב ולבנות דברים מאפס.</mark> זה לא
                הפסיק לזעוק, ולא יכולתי להתעלם מזה יותר. ככה נולד {SITE_NAME}.
              </p>
              {/* The name, at the paragraph's own size: a wink is said quietly.
                  The punchline bold, the aside after it grey. */}
              <p className={`mt-4 ${BODY}`}>
                ולגבי השם: YE זה הקיצור של שם המשפחה שלי, ו־
                <strong className="font-bold text-black">YEYE פשוט נשמע טוב יותר.</strong>{" "}
                <span className="text-black/45">(כן, זה כל הסיפור.)</span>
              </p>
            </section>
          </div>
        </div>

        {/* Held in view beside the text on a desk while it scrolls. */}
        <figure className="m-0 justify-self-center md:sticky md:top-[140px] md:justify-self-end">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/portrait.webp"
            alt={`עומר, מייסד ${SITE_NAME}`}
            width={430}
            height={560}
            className="block h-auto max-h-[70svh] w-auto max-w-full rounded-2xl"
            draggable={false}
          />
        </figure>
      </header>

      {/* THE QUESTIONS, in two columns on a desk. */}
      <Reveal className="mt-24 border-t border-black/10 pt-16 md:mt-32 md:pt-20">
        <h2 className={HEADING}>שאלות שכדאי לשאול</h2>
        <div className="mt-10 grid grid-cols-1 gap-x-16 gap-y-10 md:grid-cols-2 lg:gap-x-24">
          {QUESTIONS.map((item) => (
            <div key={item.question}>
              <h3 className="font-display text-[18px] font-bold text-black md:text-[20px]">{item.question}</h3>
              <p className="mt-2 font-body text-m-body text-black/70 md:text-[17px]">{item.answer}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* THE CLOSE: one line and the page's one button, across the row. */}
      <Reveal className="mt-24 flex flex-col items-start gap-6 border-t border-black/10 pt-16 md:mt-32 md:flex-row md:items-center md:justify-between md:pt-20">
        <p className={HEADING}>יש לכם רעיון, או רק התחלה של רעיון?</p>
        <Button href="/#cta" className="!border-black !bg-none !bg-black !shadow-none">
          קבעו פגישה
        </Button>
      </Reveal>
    </article>
  );
}
