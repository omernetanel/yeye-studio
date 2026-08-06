import HeadingSwash from "@/components/ui/HeadingSwash";
import { aboutFacts } from "@/lib/content";

/**
 * "Who I am", on black.
 *
 * It used to be a block of copy laid over the open sheet of paper in the
 * services sequence, competing with the picture it sat on. The paper now
 * carries the process diagram, which is a thing to look at rather than read
 * around — so this moved out to a section of its own, and took over the black
 * ground the process steps used to occupy.
 *
 * data-nav-dark tells the navbar to invert the logo while this is behind it.
 */
export default function AboutSection() {
  return (
    <section id="about" data-nav-dark="true" className="relative bg-black py-28 md:py-40">
      <div className="mx-auto flex w-full max-w-[1120px] items-center justify-center gap-10 px-6 lg:gap-14">
        <figure className="relative m-0 hidden shrink-0 lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/portrait.webp"
            alt="עומר, מייסד YEYE Digital"
            width={430}
            height={560}
            className="h-[430px] w-[330px] rounded-2xl object-cover shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
            draggable={false}
          />
        </figure>

        {/* No items-end: under dir="rtl" the flex END is the LEFT, so it shrank
            each paragraph to its own text width and pinned it left, leaving
            their right edges ragged against the full-width list below. */}
        <div className="flex max-w-[560px] flex-col text-right">
          {/* The heading is centred over its own column, with the swash under
              it — the rest of the column stays right-aligned. */}
          <div className="mx-auto flex flex-col items-center">
            <h2 className="font-display text-[40px] leading-none font-bold text-white sm:text-5xl md:text-[64px]">
              מי אני?
            </h2>
            <HeadingSwash className="mt-2 w-[190px] text-white md:w-[230px]" />
          </div>

          {/* text-balance rather than hand-placed breaks. Fixed breaks were
              leaving a long line above a short one at this measure, and they
              only hold at one width — the browser evens the lines out itself
              here, at every width, and never splits a phrase to do it.

              The one break kept is the one before the closing clause, which is
              the line the whole paragraph lands on and wants to stand alone. */}
          <p className="mt-6 font-body text-[15px] leading-[1.85] text-balance text-white/60">
            YEYE הוקם מתוך אובססיה לפרטים הקטנים ואמונה עמוקה שכל עסק ראוי לנוכחות דיגיטלית{" "}
            <strong className="font-semibold text-white">ברמה הגבוהה ביותר</strong>.
          </p>
          <p className="mt-4 font-body text-[15px] leading-[1.85] text-balance text-white/60">
            אני עומר, מעצב מגיל 15 ומפתח מגיל 17, ואני בונה חוויות דיגיטליות
            <br />
            <strong className="font-semibold text-white">שלא רק נראות טוב, אלא עובדות.</strong>
          </p>

          {/* Not cards, and deliberately not numbers. Every one of these is a
              plain fact about how the work is actually done, which a studio
              that subcontracts or assembles templates could not honestly write
              — where "Design-First" and a project count are things anyone can
              claim and nobody can check. Set as quiet rules-and-type rather
              than boxes so they read as substance rather than feature badges. */}
          <dl className="mt-7 w-full divide-y divide-white/12 border-y border-white/12">
            {aboutFacts.map((fact) => (
              <div key={fact.title} className="flex flex-col gap-1 py-3 text-right sm:flex-row sm:gap-4">
                <dt className="font-display text-[14px] font-bold whitespace-nowrap text-white sm:w-[150px]">
                  {fact.title}
                </dt>
                <dd className="m-0 font-body text-[13px] leading-[1.6] text-white/45">{fact.description}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-6 font-body text-[15px] leading-[1.7] text-white/60">
            אני כאן כדי להפוך את הרעיון שלך{" "}
            <strong className="font-semibold text-white">למוצר דיגיטלי שמייצר אימפקט.</strong>
          </p>
        </div>
      </div>
    </section>
  );
}
