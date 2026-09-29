"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { SITE_NAME } from "@/lib/site";

/**
 * The about page: the story the homepage has no room for.
 *
 * A READING PAGE, ON PURPOSE. Whoever gets here has usually been through the
 * whole homepage already, and a second show would read as more of the same.
 * So there is one signature moment - the greeting arriving blurred and
 * sharpening, the way it does on the homepage, which ties the two together -
 * and after it every block simply rises into place as it comes up. The page
 * scrolls like a page; nothing is pinned and nothing holds the reader.
 *
 * Every claim here is the owner's own, or already stated elsewhere on the
 * site: the month of support, teaching clients to edit their content and the
 * one business day are the service pages' and the forms' words, so no two
 * pages can disagree. No age, no years of experience and no client counts -
 * see CONTEXT.md.
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

const HEADING = "font-display text-[30px] leading-[1.15] font-extrabold tracking-tight text-black md:text-[40px]";
const BODY = "font-display text-[19px] leading-[1.7] font-light text-black/75 md:text-[21px]";
const TEXT_LINK =
  "group inline-flex items-center gap-2 font-display text-[17px] font-bold text-black underline-offset-4 hover:underline md:text-[19px]";

/** A block that rises into place once, as it comes up. */
function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  return (
    <motion.div
      className={className}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export default function AboutPageContent() {
  const prefersReducedMotion = usePrefersReducedMotion();

  // The homepage's greeting: each line arrives blurred and sharpens, the second
  // a beat after the first.
  const greetLine = (delay: number) => ({
    initial: prefersReducedMotion ? false : { opacity: 0, y: 28, filter: "blur(10px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 0.9, delay, ease: EASE },
  });

  return (
    <article className="mx-auto max-w-[1100px] px-6 pt-[150px] pb-24 md:pt-[180px]">
      {/* THE OPENING. The portrait sits beside it on a desk and under it on a
          phone - the same photograph as the homepage's, one file to replace. */}
      <header className="grid grid-cols-1 items-center gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,360px)] md:gap-16">
        <div>
          <h1 className="font-display leading-[1.06] font-bold text-black">
            <motion.span {...greetLine(0.1)} className="block text-[26px] text-black/60 md:text-[34px]">
              נעים מאוד,
            </motion.span>
            <motion.span {...greetLine(0.45)} className="block text-[52px] whitespace-nowrap md:text-[96px]">
              אני עומר.
            </motion.span>
          </h1>
          <motion.p {...greetLine(0.8)} className={`mt-6 max-w-[34ch] ${BODY}`}>
            מעצב ומפתח אתרים, ומי שעומד מאחורי{" "}
            <Link href="/" className="font-normal text-black underline underline-offset-4 hover:text-black/70">
              {SITE_NAME}
            </Link>
            .
          </motion.p>
        </div>

        <motion.figure {...greetLine(0.6)} className="m-0 justify-self-center md:justify-self-end">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/portrait.webp"
            alt={`עומר, מייסד ${SITE_NAME}`}
            width={430}
            height={560}
            className="block h-auto max-h-[60svh] w-full max-w-[360px] rounded-2xl object-cover"
            draggable={false}
          />
        </motion.figure>
      </header>

      <div className="mt-28 max-w-[760px] space-y-28 md:mt-36">
        <Reveal>
          <section>
            <h2 className={HEADING}>איך זה התחיל</h2>
            <p className={`mt-6 ${BODY}`}>
              בגיל 15 בניתי את האתר הראשון שלי, ומשם זה רק גדל: אתרי מעריצים עם עשרות עמודים ומערכת חדשות
              שעדכנה אותם, ואתר מדריכים שלימד אחרים לעצב, לבנות ולהבין קוד. אחד מהם היה אתר המעריצים
              הישראלי של קייטי פרי, שבגוגל עמד מיד אחרי האתר הרשמי שלה.
            </p>
            <p className={`mt-5 ${BODY}`}>
              במקביל הקמתי פורומים לקהילות מעריצים, ערכתי וידאו ועיצבתי בפוטושופ. אף אחד לא ביקש ממני.
              פשוט לא הצלחתי להפסיק.
            </p>
          </section>
        </Reveal>

        <Reveal>
          <section>
            <h2 className={HEADING}>למה YEYE</h2>
            <p className={`mt-6 ${BODY}`}>
              אחרי שנים של עבודה בעולם הטכנולוגי, חזרתי למה שתמיד משך אותי: לעצב ולבנות דברים מאפס. זה
              לא הפסיק לזעוק, ולא יכולתי להתעלם מזה יותר. ככה נולד {SITE_NAME}.
            </p>
            <p className={`mt-5 ${BODY}`}>
              ולגבי השם: YE זה הקיצור של שם המשפחה שלי. YEYE פשוט נשמע טוב יותר.
            </p>
          </section>
        </Reveal>

        <Reveal>
          <section>
            <h2 className={HEADING}>מה אני עושה</h2>
            <ul className="mt-8 border-b border-black/10">
              {SERVICES.map((service) => (
                <li key={service.href} className="border-t border-black/10">
                  <Link
                    href={service.href}
                    className="group flex items-center justify-between gap-6 py-5 transition-colors hover:bg-black/[0.02]"
                  >
                    <span>
                      <span className="block font-display text-[19px] font-bold text-black md:text-[22px]">
                        {service.title}
                      </span>
                      <span className="mt-1 block font-body text-m-body text-black/60">{service.description}</span>
                    </span>
                    <ArrowLeft
                      aria-hidden
                      size={20}
                      strokeWidth={1.75}
                      className="shrink-0 text-black/40 transition-transform duration-200 group-hover:-translate-x-1 group-hover:text-black"
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
            <p className={`mt-6 ${BODY}`}>
              העמוד הראשי הוא לא רק עמוד בית. זה המקום שבו אני מראה מה אפשר לעשות עם אתר, מהגלילה
              הראשונה ועד האחרונה.
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
                  <h3 className="font-display text-[19px] font-bold text-black md:text-[22px]">{item.question}</h3>
                  <p className="mt-2 font-body text-m-body text-black/70 md:text-[17px]">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className="border-t border-black/10 pt-16">
            <h2 className={HEADING}>יש לכם רעיון, או רק התחלה של רעיון?</h2>
            <div className="mt-8">
              <Button href="/#cta">קבעו פגישה</Button>
            </div>
          </section>
        </Reveal>
      </div>
    </article>
  );
}
