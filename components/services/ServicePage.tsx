"use client";

import { useRef } from "react";
import Link from "next/link";
import ArrowIcon from "@/components/ui/ArrowIcon";
import Button from "@/components/ui/Button";
import FoldWords from "@/components/ui/FoldWords";
import { ScrollPiece, useScrollPieces } from "@/components/ui/ScrollPiece";
import { services } from "@/lib/content";
import type { DesignPiece } from "@/lib/design-work";
import { useFoldLines } from "@/lib/motion/use-fold-lines";

/**
 * A service's page, in the site's own voice: black and white, type at the size
 * of the screen, numerals as the thing that is looked at, and real work.
 *
 * IT REPLACES A PAGE ASSEMBLED FROM EIGHT STOCK BLOCKS - a centred heading,
 * "what is it", cards with an icon each, a timeline, more cards, a button -
 * that could have been any product's page and looked like none of the rest of
 * this site.
 *
 * ONE SHAPE FOR EVERY SERVICE, unlike the pages for the brands, which each
 * take theirs from the brand. A service is not a brand: what a reader wants
 * from this page is the same four things whichever service it is - why it is
 * worth it, what is in it, what it has looked like, and how it goes.
 *
 * THE FIGURES COME FIRST, straight after the opening. Each was read in the
 * source it names. They are the page's strongest argument, and in the old
 * page they were three small cards a third of the way down.
 */

export interface ServiceReason {
  /** The figure, or the word that stands in its place. */
  stat: string;
  label: string;
  text: string;
  /** Where a figure taken from someone else's research comes from. */
  source?: { name: string; href: string };
}

export interface ServicePageContent {
  /** This page's own address: it places the service among the others. */
  href: string;
  /** The heading, in two lines: the first grey, the second white. */
  title: [string, string];
  lead: string;
  cta: string;
  reasonsTitle: string;
  reasons: ServiceReason[];
  /** Who it is for: the kinds of job this service is, and when each fits. */
  kindsTitle: string;
  kinds: { title: string; text: string; fits: string }[];
  includesTitle: string;
  includes: { title: string; text: string }[];
  /** Work of this kind that the site shows, each leading to its own page. */
  work: { name: string; href: string; piece: DesignPiece }[];
  stepsTitle: string;
  steps: { title: string; text: string }[];
  closing: string;
}

const two = (n: number) => String(n).padStart(2, "0");

export default function ServicePage({ content }: { content: ServicePageContent }) {
  const rootRef = useRef<HTMLDivElement>(null);
  useFoldLines(rootRef);
  useScrollPieces(rootRef);

  const index = services.findIndex((service) => service.href === content.href);
  const next = services[(index + 1) % services.length];

  return (
    <div ref={rootRef}>
      {/* THE OPENING, ON BLACK: which of the four this is, as large as the
          stages' numerals on the home page, and the page's one sentence. */}
      <section data-nav-dark="true" className="bg-black px-6 pt-32 pb-20 text-white md:pt-40 md:pb-32">
        <div className="mx-auto max-w-[1100px]">
          <p
            aria-hidden="true"
            dir="ltr"
            className="text-right font-display text-[34vw] leading-[0.8] font-extrabold tracking-tight md:text-[clamp(160px,20vw,300px)]"
          >
            {two(index + 1)}
            <span className="text-[0.4em] text-neutral-600">/{two(services.length)}</span>
          </p>
          <h1 className="mt-8 font-display text-m-display font-extrabold tracking-tight md:mt-12 md:text-[clamp(56px,7.4vw,112px)] md:leading-[1.02]">
            <span className="sr-only">{content.title.join(" ")}</span>
            <span data-fold-line className="block text-neutral-500">
              <FoldWords text={content.title[0]} />
            </span>
            <span data-fold-line className="block">
              <FoldWords text={content.title[1]} />
            </span>
          </h1>
          <p className="mt-8 max-w-[640px] font-body text-m-body text-white/75 md:mt-10 md:text-[21px] md:leading-[1.7]">
            {content.lead}
          </p>
          <div className="mt-10">
            <Button href="/#cta" className="!border-white !bg-none !bg-white !text-black !shadow-none">
              {content.cta}
            </Button>
          </div>
        </div>
      </section>

      {/* WHY IT IS WORTH IT: three reasons, each led by its figure. */}
      <section className="bg-white px-6 py-24 md:py-40">
        <div className="mx-auto max-w-[1100px]">
          <h2 className="font-display text-m-title font-extrabold tracking-tight text-black md:text-[clamp(40px,4.6vw,68px)]">
            {content.reasonsTitle}
          </h2>
          <ul className="mt-12 md:mt-20">
            {content.reasons.map((reason) => (
              <li
                key={reason.stat}
                className="grid gap-4 border-t border-black/10 py-10 md:grid-cols-12 md:gap-10 md:py-14"
              >
                <div className="md:col-span-5">
                  <p className="font-display text-[19vw] leading-[0.95] font-extrabold tracking-tight text-black md:text-[clamp(72px,8.6vw,132px)]">
                    {reason.stat}
                  </p>
                  <p className="mt-3 font-display text-m-sub font-bold text-black">{reason.label}</p>
                </div>
                <div className="md:col-span-6 md:col-start-7 md:pt-4">
                  <p className="font-body text-m-body text-black/70 md:text-[19px] md:leading-[1.7]">{reason.text}</p>
                  {reason.source && (
                    <p className="mt-4 font-body text-m-small text-black/55">
                      מקור:{" "}
                      <a
                        href={reason.source.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        dir="ltr"
                        className="underline underline-offset-4 hover:text-black"
                      >
                        {reason.source.name}
                      </a>{" "}
                      (נפתח בכרטיסייה חדשה)
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* WHO IT IS FOR, and WHAT IS IN IT: plain type in rows, no cards and no
          icons. */}
      <section className="bg-neutral-100 px-6 py-24 md:py-40">
        <div className="mx-auto max-w-[1100px]">
          <h2 className="font-display text-m-title font-extrabold tracking-tight text-black md:text-[clamp(40px,4.6vw,68px)]">
            {content.kindsTitle}
          </h2>
          <ul className="mt-12 grid gap-10 md:mt-16 md:grid-cols-3 md:gap-10">
            {content.kinds.map((kind) => (
              <li key={kind.title} className="border-t border-black pt-6">
                <h3 className="font-display text-m-lead font-bold text-black">{kind.title}</h3>
                <p className="mt-3 font-body text-m-body text-black/70 md:text-[17px] md:leading-[1.7]">{kind.text}</p>
                <p className="mt-4 font-body text-m-body font-medium text-black md:text-[17px]">{kind.fits}</p>
              </li>
            ))}
          </ul>

          <h2 className="mt-24 font-display text-m-title font-extrabold tracking-tight text-black md:mt-40 md:text-[clamp(40px,4.6vw,68px)]">
            {content.includesTitle}
          </h2>
          <ol className="mt-10 md:mt-16">
            {content.includes.map((item, itemIndex) => (
              <li
                key={item.title}
                className="grid gap-2 border-t border-black/15 py-7 md:grid-cols-12 md:items-baseline md:gap-10 md:py-9"
              >
                <span aria-hidden="true" className="font-display text-m-sub font-bold text-neutral-400 md:col-span-1">
                  {two(itemIndex + 1)}
                </span>
                <h3 className="font-display text-m-lead font-bold text-black md:col-span-5 md:text-[32px] md:leading-[1.2]">
                  {item.title}
                </h3>
                <p className="font-body text-m-body text-black/70 md:col-span-6 md:text-[18px] md:leading-[1.7]">
                  {item.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* WHAT IT HAS LOOKED LIKE: work of this kind, each picture a way into
          its own page. A service with none to show yet has no such section. */}
      {content.work.length > 0 && (
        <section className="bg-white px-6 py-24 md:py-40">
          <div className="mx-auto max-w-[1400px]">
            <h2 className="mx-auto max-w-[1100px] font-display text-m-title font-extrabold tracking-tight text-black md:text-[clamp(40px,4.6vw,68px)]">
              ככה זה נראה בפועל
            </h2>
            <div className="mt-12 grid gap-12 md:mt-20 md:grid-cols-12 md:gap-x-10">
              {content.work.map((work, workIndex) => (
                <Link
                  key={work.href}
                  href={work.href}
                  className={`group block ${workIndex % 2 === 0 ? "md:col-span-6" : "md:col-span-6 md:mt-32"}`}
                >
                  <ScrollPiece piece={work.piece} sizes="(max-width: 768px) 100vw, 46vw" />
                  <span className="mt-4 inline-flex items-center gap-2 font-display text-m-sub font-bold text-black underline-offset-4 group-hover:underline">
                    {work.name}
                    <ArrowIcon className="transition-transform duration-200 group-hover:-translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* HOW IT GOES, AND THE CLOSE, ON BLACK: the steps under their numerals,
          one thing to press, and the way on to the next service. */}
      <section data-nav-dark="true" className="bg-black px-6 py-24 text-white md:py-40">
        <div className="mx-auto max-w-[1100px]">
          <h2 className="font-display text-m-title font-extrabold tracking-tight md:text-[clamp(40px,4.6vw,68px)]">
            {content.stepsTitle}
          </h2>
          <ol className="mt-12 grid gap-12 md:mt-20 md:grid-cols-4 md:gap-8">
            {content.steps.map((step, stepIndex) => (
              <li key={step.title}>
                <p
                  aria-hidden="true"
                  dir="ltr"
                  className="text-right font-display text-[88px] leading-[0.85] font-extrabold tracking-tight md:text-[clamp(72px,7.6vw,120px)]"
                >
                  {stepIndex + 1}
                  <span className="text-[0.4em] text-neutral-600">/{content.steps.length}</span>
                </p>
                <h3 className="mt-5 font-display text-m-lead font-bold">{step.title}</h3>
                <p className="mt-3 font-body text-m-body text-white/70 md:text-[17px] md:leading-[1.7]">{step.text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-28 border-t border-white/15 pt-20 text-center md:mt-44 md:pt-28">
            <h2 className="mx-auto max-w-[900px] font-display text-m-title font-extrabold tracking-tight md:text-[clamp(44px,5.4vw,80px)] md:leading-[1.05]">
              {content.closing}
            </h2>
            <p className="mt-5 font-body text-m-body text-white/70 md:text-[19px]">
              ייעוץ ראשוני ללא עלות. אשמח לשמוע על הפרויקט שלכם.
            </p>
            <div className="mt-10 flex justify-center">
              <Button href="/#cta" className="!border-white !bg-none !bg-white !text-black !shadow-none">
                בואו נדבר
              </Button>
            </div>
            <p className="mt-10">
              <Link
                href={next.href}
                className="inline-flex items-center gap-2 font-display text-m-body text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                השירות הבא: {next.title}
                <ArrowIcon />
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
