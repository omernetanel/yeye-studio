"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import Link from "next/link";
import LiveProjectPreview from "@/components/projects/LiveProjectPreview";
import ArrowIcon from "@/components/ui/ArrowIcon";
import BladeCut from "@/components/ui/BladeCut";
import Button from "@/components/ui/Button";
import { setFold } from "@/components/ui/FoldText";
import FoldWords from "@/components/ui/FoldWords";
import { ScrollPiece, useScrollPieces } from "@/components/ui/ScrollPiece";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";

/**
 * The page for Sorozin Chef: a meat chef's brand, made again - mark, menus,
 * cards and a landing page.
 *
 * A PAGE OF ITS OWN SHAPE, like the one for MAY'S and not a copy of it. That
 * one runs with icing because its mark does. This mark is two crossed knives,
 * so here the seams between the sections are cut on the slant, one way and
 * then the other (BladeCut), and the page is black and white with no colour in
 * it at all.
 *
 * IT ENDS ON THE LIVE SITE. The brand has a landing page, so the page carries
 * the same live preview the sites' pages are built round, phone view and all.
 *
 * WHAT IS SAID IS WHAT HAPPENED, and no more: he asked for a new mark and new
 * menus; crossed butcher's knives because nothing says "meat chef" faster;
 * charcoal grey because charcoal is the fire's own material; the 26 because he
 * asked for it, beside the name so it stays clear in every version of the mark.
 * No results and no praise are claimed. SAID PLAINLY AND BRIEFLY: a line that
 * explains what a picture already shows (that a QR code is there to be
 * scanned) was written and taken out.
 */

interface Props {
  /** The landing page's address and the picture that stands in for it. */
  site: { url: string; image: string };
}

const INSTAGRAM = "https://www.instagram.com/sorozin__meatshow/";

const PIECES = [
  {
    src: "/images/projects/sorozin/sorozin2.webp",
    alt: "הלוגו של Sorozin Chef על שני סינרים, שחור ולבן",
    width: 1227,
    height: 1282,
    place: "md:col-span-5",
  },
  // THE MENUS GO HERE once they are shown anew - four of them, one for each
  // kind of event, each seen on its own.
  // The landing page as an object among the others, before it is met live
  // further down.
  {
    src: "/images/projects/sorozin/sorozinweb01.webp",
    alt: "דף הנחיתה של Sorozin Chef פתוח על מסך מחשב נייד",
    width: 1536,
    height: 1024,
    place: "md:col-span-7 md:mt-48",
  },
  // On its own row, and kept in from both edges.
  {
    src: "/images/projects/sorozin/sorozin1.webp",
    alt: "כרטיסי ביקור של Sorozin Chef, שני הצדדים",
    width: 1679,
    height: 937,
    place: "md:col-span-8 md:col-start-3 md:mt-6",
  },
];

// Where a folding line's top is on the screen, as a share of its height, while
// its letters fold in.
const FOLD = [0.92, 0.5] as const;
// The same for a seam: how deep its cut is when it comes onto the screen, and
// where on the screen it has reached its full depth.
const BLADE = [0.98, 0.4] as const;
const BLADE_START = 0.3;
// A phrase that carries its sentence: medium and full black, as on the page
// for MAY'S and the "about" page.
const EMPHASIS = "font-medium text-black";
// The mark in the opening: how much larger it starts, and how far it has
// settled by the time the page has scrolled this share of a screen.
const MARK_ZOOM = 0.05;
const MARK_SETTLE = 0.5;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export default function SorozinCase({ site }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { scrollY } = useScroll();
  useScrollPieces(rootRef);

  const move = () => {
    const root = rootRef.current;
    if (!root) return;
    const screen = window.innerHeight;
    // Every box read before any style is written. A seam is scaled from its
    // top edge, so its top is the one thing about it that never moves.
    const lines = Array.from(root.querySelectorAll<HTMLElement>("[data-fold-line]"));
    const blades = Array.from(root.querySelectorAll<HTMLElement>("[data-blade]"));
    const lineTops = lines.map((line) => line.getBoundingClientRect().top / screen);
    const bladeTops = blades.map((blade) => blade.getBoundingClientRect().top / screen);
    lines.forEach((line, index) => setFold(line, (FOLD[0] - lineTops[index]) / (FOLD[0] - FOLD[1])));
    blades.forEach((blade, index) => {
      const through = clamp01((BLADE[0] - bladeTops[index]) / (BLADE[0] - BLADE[1]));
      blade.style.transform = `scaleY(${(BLADE_START + (1 - BLADE_START) * through).toFixed(4)})`;
    });
    // The mark eases back as the page starts to move, as if the camera did.
    const mark = markRef.current;
    if (mark) {
      const gone = clamp01(window.scrollY / (screen * MARK_SETTLE));
      mark.style.transform = `scale(${(1 + MARK_ZOOM * (1 - gone)).toFixed(4)})`;
    }
  };

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (prefersReducedMotion) {
      for (const line of root.querySelectorAll<HTMLElement>("[data-fold-line]")) setFold(line, 1);
      for (const blade of root.querySelectorAll<HTMLElement>("[data-blade]")) blade.style.removeProperty("transform");
      markRef.current?.style.removeProperty("transform");
      return;
    }
    move();
    window.addEventListener("resize", move);
    return () => window.removeEventListener("resize", move);
  }, [prefersReducedMotion]);

  useMotionValueEvent(scrollY, "change", () => {
    if (!prefersReducedMotion) move();
  });

  // Where he is: his Instagram, by its name. Not the site's address - it is an
  // odd-looking one, and the site itself is further down this page, live.
  const instagramLink = (
    <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" dir="ltr" className="underline-offset-4 hover:underline">
      @sorozin__meatshow
    </a>
  );

  return (
    // No room left at the head: this page has no bar (SubPageNav bare), and its
    // black opening runs to the very top of the screen.
    <div ref={rootRef}>
      {/* THE MARK, ON BLACK - where it is drawn to stand: white letters and
          steel knives. */}
      <section
        data-nav-dark="true"
        // On a phone the black takes 78% of the first screen, whatever the
        // phone, as on the page for MAY'S: the seam closes the screen, and the
        // next section's first words start under the fold and not half folded
        // at its foot.
        className="relative flex min-h-[78svh] flex-col justify-center overflow-hidden bg-black px-6 pt-28 pb-12 text-white md:block md:min-h-0 md:pt-24 md:pb-24"
      >
        <h1 className="sr-only">Sorozin Chef</h1>
        <div ref={markRef} className="mx-auto w-[64%] max-w-[420px] will-change-transform md:max-w-[min(420px,56svh)]">
          <Image
            src="/images/projects/sorozin/sorozinlogo.webp"
            alt="הלוגו של Sorozin Chef: שתי סכיני בשר מוצלבות מעל השם"
            width={1400}
            height={1468}
            priority
            sizes="(max-width: 660px) 64vw, 420px"
            className="h-auto w-full"
          />
        </div>

        <div className="mx-auto mt-10 max-w-[1100px] font-display md:hidden">
          <p className="text-m-sub font-bold">שף בשרים / מיתוג מחדש</p>
          <p className="mt-0.5 text-m-body text-white/70">{instagramLink}</p>
        </div>

        <dl className="mx-auto mt-12 hidden max-w-[980px] gap-10 text-center font-display md:grid md:grid-cols-3">
          <div>
            <dt className="text-m-small text-white/55">העסק</dt>
            <dd className="mt-1 text-m-sub font-bold">שף בשרים לאירועים</dd>
          </div>
          <div>
            <dt className="text-m-small text-white/55">מה נעשה</dt>
            <dd className="mt-1 text-m-sub font-bold">מיתוג מחדש: לוגו, תפריטים, כרטיסי ביקור ודף נחיתה</dd>
          </div>
          <div>
            <dt className="text-m-small text-white/55">איפה הוא</dt>
            <dd className="mt-1 text-m-sub font-bold">
              {instagramLink}
              <span className="mt-1 block font-body text-[12px] font-normal text-white/55">
                אינסטגרם, נפתח בכרטיסייה חדשה
              </span>
            </dd>
          </div>
        </dl>
      </section>

      {/* THE IDEA. */}
      <section className="relative bg-white px-6 pt-40 pb-24 md:pt-72 md:pb-36">
        <BladeCut className="bg-black" />
        <div className="mx-auto max-w-[1100px]">
          <h2 className="font-display text-m-display font-extrabold tracking-tight text-black md:text-[clamp(56px,7.4vw,112px)] md:leading-[1.02]">
            <span className="sr-only">שף בשרים. שיבינו מהרגע הראשון.</span>
            <span data-fold-line className="block text-heading-soft">
              <FoldWords text="שף בשרים." />
            </span>
            <span data-fold-line className="block">
              <FoldWords text="שיבינו מהרגע הראשון." />
            </span>
          </h2>
          {/* Everything said about the mark, here and in three short
              paragraphs. Its colour and its number had a section of their own
              - a screen of charcoal with CHEF 26 across it - and it was a great
              deal of room for two remarks. */}
          <div className="mt-12 grid gap-6 font-body text-m-body text-black/70 md:mt-16 md:grid-cols-3 md:gap-10 md:text-[19px] md:leading-[1.7]">
            <p>
              מיתוג מחדש לשף בשרים שעושה אירועים: לוגו, תפריטים, כרטיסי ביקור ודף נחיתה.{" "}
              <strong className={EMPHASIS}>מהמיתוג הקודם לא נשאר דבר</strong>.
            </p>
            <p>
              הסמל: שתי סכיני בשר מוצלבות. הקלאסי ביותר בתחום, ובכוונה.{" "}
              <strong className={EMPHASIS}>לוגו של שף בשרים צריך להיקרא במבט אחד</strong>, לא להתפענח.
            </p>
            <p>
              הצבע: <strong className={EMPHASIS}>אפור פחם</strong>, ולא האדום שהתחום כולו צבוע בו. ה-26 יושב לצד
              השם ולא בתוך הסמל, וכך נשאר קריא בכל גודל.
            </p>
          </div>
        </div>
      </section>

      {/* WHAT THE MARK WENT ON, with nothing written under it - what each
          picture shows is its alt. Two columns that do not line up, as on the
          home page; one column on a phone. On the lightest grey, a step off
          the white on either side of it, so that it is a section of its own
          with a seam at its head. */}
      <section className="relative bg-neutral-100 px-6 pt-40 pb-24 md:pt-72 md:pb-40">
        <BladeCut className="bg-white" flip />
        {/* ITS HEADING IS THE KIND OF JOB THIS WAS, said once and large: not a
            new brand but an old one made again. Grey, so that it is the
            ground the pictures stand on and not one more thing to read; and
            on the left, the far side from where the page's own text starts.
            The section's name to a screen reader is said in words beside it. */}
        <h2
          data-fold-line
          lang="en"
          dir="ltr"
          className="mx-auto mb-12 max-w-[1400px] text-left font-display text-[15.5vw] leading-[0.95] font-extrabold tracking-tight text-heading-soft md:mb-20 md:text-[clamp(96px,13.5vw,210px)]"
        >
          <span className="sr-only">Rebrand</span>
          <FoldWords text="#REBRAND" />
        </h2>
        <div className="mx-auto grid max-w-[1400px] gap-10 md:grid-cols-12 md:gap-x-6">
          {PIECES.map((piece) => (
            <div key={piece.src} className={piece.place}>
              <ScrollPiece piece={piece} sizes="(max-width: 768px) 100vw, 60vw" />
            </div>
          ))}
        </div>

        {/* ONE LINE FROM HIM GOES HERE, between the pictures and the live site,
            once he has approved its wording: one quote, his name, and what he
            is to the business. It also parts the picture of the landing page
            from the landing page itself. */}
      </section>

      {/* THE LANDING PAGE, LIVE, IN A SECTION OF ITS OWN: the site itself in
          the frame, to scroll in and to see as a phone would show it. At the
          foot of the pictures it was one more thing in their section. NO
          HEADING TO SEE: "and the landing page, live" stood here, and it only
          announced what the frame under it already shows. */}
      <section className="relative bg-white px-6 pt-40 pb-24 md:pt-72 md:pb-40">
        <BladeCut className="bg-neutral-100" />
        <div className="mx-auto max-w-[1400px]">
          <div className="mx-auto max-w-[1100px]">
            <h2 className="sr-only">דף הנחיתה</h2>
            <div className="mb-12 grid gap-6 font-body text-m-body text-black/70 md:mb-20 md:grid-cols-2 md:gap-10 md:text-[19px] md:leading-[1.7]">
              <p>
                דף בהיר למותג כהה. כך קרש החיתוך שנושא את הלוגו הוא הדבר הראשון שרואים,{" "}
                <strong className={EMPHASIS}>ומקבל את כל תשומת הלב</strong>.
              </p>
              <p>
                המראה לקוח מעולם של ספרי בישול, לא מעולם של מסעדות בשר:{" "}
                <strong className={EMPHASIS}>הרבה לבן, חומר גלם אחד במרכז</strong>, והחתימה של השף מתחת לטקסט.
              </p>
            </div>
          </div>
          <LiveProjectPreview url={site.url} title="דף הנחיתה של Sorozin Chef" fallbackImage={site.image} />
        </div>
      </section>

      {/* THE CLOSE: back to black, and one thing to press. */}
      <section
        data-nav-dark="true"
        className="relative bg-black px-6 pt-48 pb-24 text-center text-white md:pt-80 md:pb-32"
      >
        <BladeCut className="bg-white" flip />
        <h2 className="mx-auto max-w-[900px] font-display text-m-title font-extrabold tracking-tight md:text-[clamp(44px,5.4vw,80px)] md:leading-[1.05]">
          רוצים מותג שמבינים מהרגע הראשון?
        </h2>
        <div className="mt-10 flex justify-center">
          <Button href="/#cta" className="!border-white !bg-none !bg-white !text-black !shadow-none">
            בואו נדבר
          </Button>
        </div>
        {/* And a way on for a reader who is not ready to talk: back to the rest
            of the work. Quiet, under the button, so it does not compete with
            it. */}
        <p className="mt-8">
          <Link
            href="/#projects"
            className="inline-flex items-center gap-2 font-display text-m-body text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            לעבודות נוספות
            <ArrowIcon />
          </Link>
        </p>
      </section>
    </div>
  );
}
