"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import HeadingSwash from "@/components/ui/HeadingSwash";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { SITE_NAME } from "@/lib/site";

/**
 * The about page: the story the homepage has no room for, told in chapters.
 *
 * NOT AN ARTICLE. A first version was headings over paragraphs, and it read
 * like a news site. Here each part of the story is ONE sentence set large on
 * the black the homepage's "who I am" is set on - the same weight and size as
 * its closing line - with at most a short line of detail under it. The reader
 * remembers sentences, not paragraphs. Services, questions and the ask come
 * after, compact, because by then the story has done its work.
 *
 * NOTHING STARTS EMPTY. The opening is on screen from the first frame: only
 * the greeting's two lines arrive, and quickly. The chapters below rise as
 * they come up, and the page scrolls like a page - nothing is pinned.
 *
 * Every claim is the owner's own, or already stated elsewhere on the site: the
 * month of support, teaching clients to edit their content and the one business
 * day are the service pages' and the forms' words. No age, no years of
 * experience and no client counts - see CONTEXT.md.
 */

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

// Five, one line each: the homepage groups landing pages with business sites,
// but each has a page of its own, and this is the one place that can point a
// reader at all five by name.
const SERVICES = [
  { title: "אתרי תדמית", description: "אתר שמייצג את העסק ובונה אמון מהרגע הראשון.", href: "/services/business-sites" },
  { title: "דפי נחיתה", description: "דף אחד, מטרה אחת, בנוי כדי שיפנו.", href: "/services/landing-pages" },
  { title: "חנויות אונליין", description: "מהמוצר ועד התשלום, בלי חיכוך.", href: "/services/online-stores" },
  { title: "מיתוג", description: "זהות שלמה: לוגו, צבעים, טיפוגרפיה ומדריך מותג.", href: "/services/branding" },
  { title: "מערכות ודשבורדים", description: "כלי עבודה שמסדרים את העסק במקום אחד.", href: "/services/dashboards" },
];

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

// The chapter sentence is the homepage's closing line: m-lead on a phone, 60px
// on a desk.
const STATEMENT = "font-display text-m-lead font-bold text-white md:text-[60px] md:leading-[1.12]";
const LABEL = "font-display text-[15px] font-bold text-white/50 md:text-[16px]";
const DETAIL = "max-w-[46ch] font-display text-[17px] leading-[1.7] font-light text-white/65 md:text-[20px]";
const HEADING = "font-display text-[28px] leading-[1.15] font-extrabold tracking-tight text-white md:text-[40px]";
const TEXT_LINK =
  "group inline-flex items-center gap-2 font-display text-[17px] font-bold text-white underline-offset-4 hover:underline md:text-[19px]";

/** A block that rises into place once, as it comes up. */
function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  return (
    <motion.div
      className={className}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/**
 * One chapter: a small label, the sentence, and a line of detail under it.
 * Each line of the sentence is its own block, so a break falls where the
 * thought does rather than wherever the width runs out.
 */
function Chapter({ label, lines, children }: { label: string; lines: ReactNode[]; children?: ReactNode }) {
  return (
    <section className="flex min-h-[70svh] items-center py-16">
      <Reveal className="w-full">
        <p className={LABEL}>{label}</p>
        <p className={`mt-5 ${STATEMENT}`}>
          {lines.map((line, i) => (
            <span key={i} className="block text-balance">
              {line}
            </span>
          ))}
        </p>
        {children}
      </Reveal>
    </section>
  );
}

export default function AboutPageContent() {
  const prefersReducedMotion = usePrefersReducedMotion();

  // The homepage's greeting: each line arrives blurred and sharpens, the second
  // a beat after the first. Quick, so the screen is never empty for long.
  const greetLine = (delay: number) => ({
    initial: prefersReducedMotion ? false : { opacity: 0, y: 20, filter: "blur(8px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 0.7, delay, ease: EASE },
  });

  return (
    <article className="mx-auto max-w-[1100px] px-6">
      {/* THE OPENING, a screen tall. The portrait is on screen from the first
          frame - the same photograph as the homepage's, one file to replace. */}
      <header className="grid min-h-[100svh] grid-cols-1 content-center items-center gap-10 pt-[130px] pb-16 md:grid-cols-[minmax(0,1fr)_minmax(0,380px)] md:gap-16 md:pt-[110px]">
        <div>
          <h1 className="font-display leading-[1.06] font-bold text-white">
            <motion.span {...greetLine(0)} className="block text-[26px] text-white/60 md:text-[34px]">
              נעים מאוד,
            </motion.span>
            <motion.span {...greetLine(0.25)} className="block text-[52px] whitespace-nowrap md:text-[96px]">
              אני עומר.
            </motion.span>
          </h1>
          <motion.p {...greetLine(0.5)} className={`mt-6 ${DETAIL}`}>
            מעצב ומפתח אתרים, ומי שעומד מאחורי{" "}
            <Link href="/" className="font-normal text-white underline underline-offset-4 hover:text-white/70">
              {SITE_NAME}
            </Link>
            .
          </motion.p>
        </div>

        <figure className="m-0 justify-self-center md:justify-self-end">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/portrait.webp"
            alt={`עומר, מייסד ${SITE_NAME}`}
            width={430}
            height={560}
            className="block h-auto max-h-[52svh] w-auto max-w-full rounded-2xl"
            draggable={false}
          />
        </figure>
      </header>

      <Chapter label="איך זה התחיל" lines={["בגיל 15 בניתי", "את האתר הראשון שלי."]}>
        <p className={`mt-8 ${DETAIL}`}>
          ומשם זה רק גדל: אתרי מעריצים עם עשרות עמודים ומערכת חדשות שעדכנה אותם, ואתר מדריכים שלימד
          אחרים לעצב, לבנות ולהבין קוד.
        </p>
      </Chapter>

      <Chapter
        label="אחד מהם"
        lines={[
          "אתר המעריצים הישראלי של קייטי פרי.",
          <span key="after" className="text-white/45">
            בגוגל, מיד אחרי האתר הרשמי שלה.
          </span>,
        ]}
      >
        <p className={`mt-8 ${DETAIL}`}>
          במקביל הקמתי פורומים לקהילות מעריצים, ערכתי וידאו ועיצבתי בפוטושופ. אף אחד לא ביקש ממני. פשוט
          לא הצלחתי להפסיק.
        </p>
      </Chapter>

      <Chapter label="למה YEYE" lines={["חזרתי למה", "שתמיד משך אותי."]}>
        <p className={`mt-8 ${DETAIL}`}>
          אחרי שנים של עבודה בעולם הטכנולוגי, חזרתי לעצב ולבנות דברים מאפס. זה לא הפסיק לזעוק, ולא יכולתי
          להתעלם מזה יותר. ככה נולד {SITE_NAME}.
        </p>
      </Chapter>

      <Chapter label="ולגבי השם" lines={["YE זה הקיצור של שם המשפחה שלי.", "YEYE פשוט נשמע טוב יותר."]}>
        <HeadingSwash className="mt-8 w-[260px] text-white md:w-[360px]" />
      </Chapter>

      {/* AFTER THE STORY, the practical part, compact: by now the story has
          done its work, and these are for whoever wants the details. */}
      <div className="space-y-24 border-t border-white/10 pt-24 pb-28 md:space-y-32 md:pt-32">
        <Reveal>
          <section>
            <h2 className={HEADING}>מה אני עושה</h2>
            <ul className="mt-8 border-b border-white/10">
              {SERVICES.map((service) => (
                <li key={service.href} className="border-t border-white/10">
                  <Link
                    href={service.href}
                    className="group flex items-center justify-between gap-6 py-5 transition-colors hover:bg-white/[0.03]"
                  >
                    <span>
                      <span className="block font-display text-[19px] font-bold text-white md:text-[22px]">
                        {service.title}
                      </span>
                      <span className="mt-1 block font-body text-m-body text-white/60">{service.description}</span>
                    </span>
                    <ArrowLeft
                      aria-hidden
                      size={20}
                      strokeWidth={1.75}
                      className="shrink-0 text-white/40 transition-transform duration-200 group-hover:-translate-x-1 group-hover:text-white"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>

        {/* THE WAY ON TO THE HOMEPAGE, for whoever arrived here from a search:
            they have read who is behind the site and not yet seen what it does.
            Text links, not buttons - the page's one button is the meeting at
            the end - and nothing automatic. */}
        <Reveal>
          <section>
            <h2 className={HEADING}>רוצים לראות את זה בפעולה?</h2>
            <p className={`mt-6 ${DETAIL}`}>
              העמוד הראשי הוא לא רק עמוד בית. זה המקום שבו אני מראה מה אפשר לעשות עם אתר, מהגלילה הראשונה ועד
              האחרונה.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
              <Link href="/" className={TEXT_LINK}>
                לחוויה המלאה
                <ArrowLeft aria-hidden size={18} strokeWidth={2} className="transition-transform duration-200 group-hover:-translate-x-1" />
              </Link>
              <Link href="/#projects" className={TEXT_LINK}>
                לעבודות
                <ArrowLeft aria-hidden size={18} strokeWidth={2} className="transition-transform duration-200 group-hover:-translate-x-1" />
              </Link>
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section>
            <h2 className={HEADING}>שאלות שכדאי לשאול</h2>
            <div className="mt-8 space-y-8">
              {QUESTIONS.map((item) => (
                <div key={item.question}>
                  <h3 className="font-display text-[19px] font-bold text-white md:text-[22px]">{item.question}</h3>
                  <p className="mt-2 max-w-[60ch] font-body text-m-body text-white/65 md:text-[17px]">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section>
            <p className={STATEMENT}>
              <span className="block text-balance">יש לכם רעיון,</span>
              <span className="block text-balance">או רק התחלה של רעיון?</span>
            </p>
            <div className="mt-10">
              <Button href="/#cta" className="!border-white !bg-none !bg-white !text-black !shadow-none">
                קבעו פגישה
              </Button>
            </div>
          </section>
        </Reveal>
      </div>
    </article>
  );
}
