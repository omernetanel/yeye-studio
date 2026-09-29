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
 * The about page: a profile, not an advert.
 *
 * THE FIRST SCREEN CARRIES THE ANSWER. Two earlier versions opened on a name
 * and a photograph and left the rest below the fold - a screen that looked
 * empty. Here the opening already says who, what, since when and for whom: the
 * name, a two-sentence introduction and four plain facts. Nothing in it
 * animates, so it is there on the first frame.
 *
 * THE PHOTOGRAPH BELONGS TO THE STORY, so it sits beside it - held in view on
 * a desk while the story scrolls past, and between the opening and the story on
 * a phone.
 *
 * LESS SELLING. No list of services and no "see it in action" block: the page
 * ends on one quiet line and one button, with the work and the services as
 * plain links under it.
 *
 * Every claim is the owner's own, or already stated elsewhere on the site: the
 * month of support, teaching clients to edit their content and the one business
 * day are the service pages' and the forms' words. No age, no years of
 * experience and no client counts - see CONTEXT.md.
 */

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

const FACTS = [
  { label: "סטודיו", value: SITE_NAME },
  { label: "תחום", value: "עיצוב ופיתוח אתרים" },
  { label: "התחלתי", value: "בגיל 15, באתרי מעריצים" },
  { label: "עובד עם", value: "עסקים קטנים וגדולים" },
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

// Plain links at the foot of the page, for whoever wants more: the work first,
// then each service by name.
const MORE_LINKS = [
  { label: "העבודות", href: "/#projects" },
  { label: "אתרי תדמית", href: "/services/business-sites" },
  { label: "דפי נחיתה", href: "/services/landing-pages" },
  { label: "חנויות אונליין", href: "/services/online-stores" },
  { label: "מיתוג", href: "/services/branding" },
  { label: "מערכות ודשבורדים", href: "/services/dashboards" },
];

const HEADING = "font-display text-[26px] leading-[1.2] font-extrabold tracking-tight text-black md:text-[34px]";
const BODY = "font-display text-[18px] leading-[1.75] font-light text-black/75 md:text-[20px]";
// The homepage's closing-line size, for the two sentences worth remembering.
const STATEMENT = "font-display text-m-lead font-bold text-black md:text-[44px] md:leading-[1.15]";

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
    <article className="mx-auto max-w-[1160px] px-6 pt-[140px] pb-24 md:pt-[160px]">
      {/* THE OPENING: who, what, since when, for whom - all on the first
          screen, and none of it animated. */}
      <header>
        <p className="font-display text-[15px] font-bold text-black/45 md:text-[16px]">מי אני</p>
        <h1 className="mt-3 font-display text-[44px] leading-[1.05] font-extrabold tracking-tight text-black md:text-[80px]">
          נעים מאוד, אני עומר.
        </h1>
        <p className="mt-6 max-w-[40ch] font-display text-[20px] leading-[1.6] font-light text-black/75 md:text-[26px]">
          מעצב ומפתח אתרים, ומי שעומד מאחורי{" "}
          <Link href="/" className="font-normal text-black underline underline-offset-4 hover:text-black/70">
            {SITE_NAME}
          </Link>
          . אני בונה אתרים מגיל 15, והיום מעצב ובונה אותם מאפס, מהרעיון ועד האתר שעולה לאוויר.
        </p>

        <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-black/10 pt-8 md:mt-16 md:grid-cols-4">
          {FACTS.map((fact) => (
            <div key={fact.label}>
              <dt className="font-display text-[14px] text-black/45">{fact.label}</dt>
              <dd className="mt-1 font-display text-[17px] font-bold text-black md:text-[19px]">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      {/* THE STORY, with the photograph beside it. On a desk the picture is
          held in view (sticky) while the story scrolls; on a phone it comes
          first, between the opening and the story. */}
      <div className="mt-20 grid grid-cols-1 gap-12 md:mt-28 md:grid-cols-[minmax(0,1fr)_minmax(0,340px)] md:gap-20">
        <figure className="m-0 md:sticky md:top-[140px] md:order-last md:self-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/portrait.webp"
            alt={`עומר, מייסד ${SITE_NAME}`}
            width={430}
            height={560}
            className="mx-auto block h-auto w-full max-w-[340px] rounded-2xl"
            draggable={false}
          />
          <figcaption className="mt-3 text-center font-body text-m-small text-black/45 md:text-start">
            עומר, {SITE_NAME}
          </figcaption>
        </figure>

        <div className="space-y-20 md:space-y-24">
          <Reveal>
            <section>
              <h2 className={HEADING}>איך זה התחיל</h2>
              <p className={`mt-5 ${BODY}`}>
                בגיל 15 בניתי את האתר הראשון שלי, ומשם זה רק גדל: אתרי מעריצים עם עשרות עמודים ומערכת חדשות
                שעדכנה אותם, ואתר מדריכים שלימד אחרים לעצב, לבנות ולהבין קוד.
              </p>
              <p className={`mt-8 ${STATEMENT}`}>
                <span className="block text-balance">אחד מהם היה אתר המעריצים הישראלי של קייטי פרי.</span>
                <span className="block text-balance text-black/40">בגוגל, מיד אחרי האתר הרשמי שלה.</span>
              </p>
              <p className={`mt-8 ${BODY}`}>
                במקביל הקמתי פורומים לקהילות מעריצים, ערכתי וידאו ועיצבתי בפוטושופ. אף אחד לא ביקש ממני. פשוט
                לא הצלחתי להפסיק.
              </p>
            </section>
          </Reveal>

          <Reveal>
            <section>
              <h2 className={HEADING}>למה YEYE</h2>
              <p className={`mt-5 ${BODY}`}>
                אחרי שנים של עבודה בעולם הטכנולוגי, חזרתי למה שתמיד משך אותי: לעצב ולבנות דברים מאפס. זה לא
                הפסיק לזעוק, ולא יכולתי להתעלם מזה יותר. ככה נולד {SITE_NAME}.
              </p>
              <p className={`mt-8 ${BODY}`}>ולגבי השם:</p>
              <p className={`mt-2 ${STATEMENT}`}>
                <span className="block text-balance">YE זה הקיצור של שם המשפחה שלי.</span>
                <span className="block text-balance">YEYE פשוט נשמע טוב יותר.</span>
              </p>
              <HeadingSwash className="mt-6 w-[220px] text-black md:w-[300px]" />
            </section>
          </Reveal>

          <Reveal>
            <section>
              <h2 className={HEADING}>שאלות שכדאי לשאול</h2>
              <div className="mt-8 space-y-8">
                {QUESTIONS.map((item) => (
                  <div key={item.question} className="border-t border-black/10 pt-6">
                    <h3 className="font-display text-[18px] font-bold text-black md:text-[20px]">{item.question}</h3>
                    <p className="mt-2 max-w-[60ch] font-body text-m-body text-black/70 md:text-[17px]">{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          </Reveal>

          {/* THE CLOSE: one quiet line, the page's one button, and plain links
              for whoever wants more. */}
          <Reveal>
            <section className="border-t border-black/10 pt-12">
              <p className={HEADING}>רוצים לדבר?</p>
              <p className={`mt-3 ${BODY}`}>יש לכם רעיון, או רק התחלה של רעיון? אשמח לשמוע.</p>
              <div className="mt-8">
                <Button href="/#cta" className="!border-black !bg-none !bg-black !shadow-none">
                  קבעו פגישה
                </Button>
              </div>
              <nav aria-label="עוד באתר" className="mt-12">
                <p className="font-display text-[14px] text-black/45">עוד באתר</p>
                <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
                  {MORE_LINKS.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-center gap-1.5 font-display text-[16px] text-black/70 transition-colors hover:text-black"
                      >
                        {link.label}
                        <ArrowLeft
                          aria-hidden
                          size={15}
                          strokeWidth={2}
                          className="transition-transform duration-200 group-hover:-translate-x-1"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </section>
          </Reveal>
        </div>
      </div>
    </article>
  );
}
