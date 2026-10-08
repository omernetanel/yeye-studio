"use client";

import Image from "next/image";
import { Fragment, useLayoutEffect, useRef } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import Button from "@/components/ui/Button";
import FoldText, { setFold } from "@/components/ui/FoldText";
import GlazeDrips from "@/components/ui/GlazeDrips";
import { ScrollPiece, useScrollPieces } from "@/components/ui/ScrollPiece";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";

/**
 * The page for MAY'S: a bakery's brand, made whole - mark, line, menu, cards
 * and stickers.
 *
 * NOT THE PROJECT PAGE THE SITES GET. Those are built round a live site in a
 * frame, and there is no site here. This one is built round the mark itself:
 * letters with icing running off them. So the mark opens the page at full
 * width on black, where its cream reads; the seams between the sections run
 * the way the icing does (GlazeDrips); and one section is given over to the
 * brand's pink - the only place on the site with a colour that is not the
 * site's own, because the page is about a brand that has one.
 *
 * WHAT IS SAID IS WHAT HAPPENED, and no more: the bakery is new, the hand was
 * free, the cinnamon roll is the centre of the business and so it became the
 * mark, and the line came from the product. No results and no praise are
 * claimed, and nobody is quoted.
 *
 * The laptop picture from the home page is left out: it shows the mark, and
 * the mark is already the first thing on this page.
 */

const INSTAGRAM = "https://www.instagram.com/mays_cinnabon/";

const PIECES = [
  {
    label: "כרטיסי ביקור ומדבקות",
    src: "/images/projects/mays2.webp",
    alt: "כרטיסי ביקור וגיליון מדבקות של MAY'S",
    width: 1254,
    height: 1254,
  },
  // THE PACKAGING GOES HERE once its 3D model exists, and after it whatever
  // else is made: the brand sheet, the posts, the adverts.
  {
    label: "פוסטר ותפריט",
    src: "/images/projects/mays3.webp",
    alt: "פוסטר ותפריט של MAY'S",
    width: 1448,
    height: 1086,
  },
];

// Where a folding line's top is on the screen, as a share of its height, while
// its letters fold in.
const FOLD = [0.92, 0.5] as const;
// The mark in the opening: how much larger it starts, and how far it has
// settled by the time the page has scrolled this share of a screen.
const MARK_ZOOM = 0.05;
const MARK_SETTLE = 0.5;

/**
 * A line that folds in, cut into words that do not break. FoldText sets every
 * letter as a box of its own, and a line of such boxes wraps wherever it runs
 * out of room - in the middle of a word.
 */
function FoldWords({ text }: { text: string }) {
  return text.split(" ").map((word, index) => (
    <Fragment key={index}>
      {index > 0 && " "}
      <span className="inline-block whitespace-nowrap">
        <FoldText text={word} />
      </span>
    </Fragment>
  ));
}

export default function MaysCase() {
  const rootRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { scrollY } = useScroll();
  useScrollPieces(rootRef);

  const move = () => {
    const root = rootRef.current;
    if (!root) return;
    const screen = window.innerHeight;
    // Every box read before any style is written.
    const lines = Array.from(root.querySelectorAll<HTMLElement>("[data-fold-line]"));
    const tops = lines.map((line) => line.getBoundingClientRect().top / screen);
    lines.forEach((line, index) => setFold(line, (FOLD[0] - tops[index]) / (FOLD[0] - FOLD[1])));
    // The mark eases back as the page starts to move, as if the camera did.
    const mark = markRef.current;
    if (mark) {
      const gone = Math.min(1, Math.max(0, window.scrollY / (screen * MARK_SETTLE)));
      mark.style.transform = `scale(${(1 + MARK_ZOOM * (1 - gone)).toFixed(4)})`;
    }
  };

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (prefersReducedMotion) {
      for (const line of root.querySelectorAll<HTMLElement>("[data-fold-line]")) setFold(line, 1);
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

  return (
    // No room left at the head: this page has no bar (SubPageNav bare), and its
    // black opening runs to the very top of the screen.
    <div ref={rootRef}>
      {/* THE MARK, ON BLACK. It is cream, and on the white of the other pages
          it would be a ghost. */}
      <section
        data-nav-dark="true"
        className="relative overflow-hidden bg-black px-6 pt-32 pb-16 text-white md:pt-36 md:pb-20"
      >
        <h1 className="sr-only">MAY&apos;S</h1>
        <div ref={markRef} className="mx-auto w-[78%] max-w-[640px] will-change-transform">
          <Image
            src="/images/projects/mayslogo.webp"
            alt="הלוגו של MAY'S: אותיות שזיגוג נוזל מהן"
            width={2400}
            height={1412}
            priority
            sizes="(max-width: 820px) 78vw, 640px"
            className="h-auto w-full"
          />
        </div>

        {/* Four plain facts, the way a studio heads a piece of work. */}
        <dl className="mx-auto mt-14 grid max-w-[1100px] gap-8 font-display md:mt-20 md:grid-cols-4 md:gap-6">
          <div>
            <dt className="text-m-small text-white/55">העסק</dt>
            <dd className="mt-1 text-m-sub font-bold">קונדיטוריה</dd>
          </div>
          <div>
            <dt className="text-m-small text-white/55">מה נעשה</dt>
            <dd className="mt-1 text-m-sub font-bold">לוגו, סלוגן, תפריט, כרטיסי ביקור ומדבקות</dd>
          </div>
          <div>
            <dt className="text-m-small text-white/55">איפה היא</dt>
            <dd className="mt-1 text-m-sub font-bold">
              <a
                href={INSTAGRAM}
                target="_blank"
                rel="noopener noreferrer"
                dir="ltr"
                className="underline-offset-4 hover:underline"
              >
                @mays_cinnabon
              </a>
              <span className="mt-1 block font-body text-[12px] font-normal text-white/55">
                אינסטגרם, נפתח בכרטיסייה חדשה
              </span>
            </dd>
          </div>
          {/* Who made it. A studio lists a photographer, a writer, an
              illustrator; here it is one name, which is the point of the
              studio and worth saying on the work itself. */}
          <div>
            <dt className="text-m-small text-white/55">קרדיט</dt>
            <dd className="mt-1 text-m-sub font-bold">עיצוב, סלוגן והדמיות: עומר</dd>
          </div>
        </dl>
      </section>

      {/* THE IDEA. */}
      <section className="relative bg-white px-6 pt-48 pb-24 md:pt-64 md:pb-36">
        <GlazeDrips className="fill-black" />
        <div className="mx-auto max-w-[1100px]">
          <h2
            aria-label="אם הסינבון הוא המרכז, הוא יהיה הלוגו."
            className="font-display text-m-display font-extrabold tracking-tight text-black md:text-[clamp(56px,7.4vw,112px)] md:leading-[1.02]"
          >
            <span data-fold-line className="block text-black/30">
              <FoldWords text="אם הסינבון הוא המרכז," />
            </span>
            <span data-fold-line className="block">
              <FoldWords text="הוא יהיה הלוגו." />
            </span>
          </h2>
          <div className="mt-12 grid gap-6 font-body text-m-body text-black/70 md:mt-16 md:grid-cols-2 md:gap-10 md:text-[19px] md:leading-[1.7]">
            <p>
              MAY&apos;S היא קונדיטוריה חדשה, והסינבון הוא הלב שלה. אז כל המותג נבנה סביבו.
            </p>
            <p>
              הזיגוג הלבן שנוזל על סינבון הוא הדבר הכי מזוהה איתו: רואים אותו, ויודעים מיד מה זה. אז
              הוא הפך לסימן של המותג, והאותיות של הלוגו נוזלות בדיוק כמוהו.
            </p>
          </div>
        </div>
      </section>

      {/* THE LINE, IN THE BRAND'S OWN COLOUR. */}
      <section className="relative bg-linear-to-b from-mays-pink to-mays-pink-deep px-6 pt-48 pb-24 md:pt-64 md:pb-36">
        <GlazeDrips className="fill-white" />
        <div className="mx-auto max-w-[1100px]">
          {/* A plain label, medium-small. It was a round white sticker for a
              round: it read as a prop stuck on the page, not as part of it. */}
          <p className="font-display text-m-sub font-bold text-black/70 md:text-[24px]">הסלוגן</p>
          <h2
            data-fold-line
            aria-label="זה באמת ממכר."
            className="mt-3 font-display text-[19vw] leading-[0.95] font-extrabold tracking-tight text-black md:text-[clamp(96px,13vw,200px)]"
          >
            <FoldWords text="זה באמת ממכר." />
          </h2>
          <p className="mt-10 max-w-[560px] font-body text-m-body text-black/75 md:mt-14 md:text-[19px] md:leading-[1.7]">
            הוא בא מהמוצר עצמו. הסינבון שלה רך, מתוק במידה ומדויק, ואחרי אחד רוצים עוד. לא היה צריך
            להמציא כלום.
          </p>
        </div>
      </section>

      {/* WHAT IT WAS PRINTED ON. Two columns that do not line up, as on the
          home page; one column on a phone. */}
      <section className="relative bg-white px-6 pt-48 pb-24 md:pt-64 md:pb-40">
        <GlazeDrips className="fill-mays-pink-deep" />
        <div className="mx-auto grid max-w-[1400px] gap-10 md:grid-cols-12 md:gap-x-6">
          {PIECES.map((piece, index) => (
            <div key={piece.src} className={index % 2 === 0 ? "md:col-span-5" : "md:col-span-7 md:mt-48"}>
              <ScrollPiece piece={piece} sizes="(max-width: 768px) 100vw, 55vw" />
              <p className="mt-3 font-display text-m-small text-black/60">{piece.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* THE CLOSE: back to black, and one thing to press. */}
      <section
        data-nav-dark="true"
        className="relative bg-black px-6 pt-48 pb-24 text-center text-white md:pt-64 md:pb-32"
      >
        <GlazeDrips className="fill-white" />
        <h2 className="mx-auto max-w-[900px] font-display text-m-title font-extrabold tracking-tight md:text-[clamp(44px,5.4vw,80px)] md:leading-[1.05]">
          רוצים מותג שמתחיל מהמוצר שלכם?
        </h2>
        <div className="mt-10 flex justify-center">
          <Button href="/#cta" className="!border-white !bg-none !bg-white !text-black !shadow-none">
            בואו נדבר
          </Button>
        </div>
      </section>
    </div>
  );
}
