"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import ArrowIcon from "@/components/ui/ArrowIcon";
import Button from "@/components/ui/Button";
import { ScrollPiece, useScrollPieces } from "@/components/ui/ScrollPiece";
import type { DesignPiece } from "@/lib/design-work";
import { cn } from "@/lib/utils";

/** A piece of work of the kind the page is about, and its own page on this site. */
export interface ServiceWorkItem {
  name: string;
  href: string;
  piece: DesignPiece;
}

interface ServiceHeroProps {
  titleLine1: string;
  titleLine2: string;
  description: string;
  ctaLabel: string;
  /** One or two pieces of work to stand beside the heading. */
  work?: ServiceWorkItem[];
}

/**
 * The opening of a service page: the heading, one sentence and one button -
 * AND, BESIDE THEM, WORK OF THAT KIND, each picture a way into its own page.
 *
 * A heading, a sentence and a button on white answered nothing: whoever opens
 * this page wants to know what the service looks like when this studio does
 * it. Of six studios looked at (2026-10-13) only one has a page for each
 * thing it offers, and that page opens on the name, a line and a row of work.
 *
 * On a desk the words stand on the reading side and the work on the other, the
 * two pictures side by side with the second set lower. On a phone the work
 * follows the button. A service with no work to show yet keeps the opening it
 * had: the words alone, in the middle.
 *
 * The second line of the heading arrives black and turns grey under a glint
 * (.hero-glint in globals.css).
 */
export default function ServiceHero({ titleLine1, titleLine2, description, ctaLabel, work = [] }: ServiceHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  useScrollPieces(sectionRef);
  const withWork = work.length > 0;

  return (
    <section ref={sectionRef} className="px-6 pt-[150px] pb-20 md:px-12 md:pt-[176px]">
      <div
        className={cn(
          "mx-auto",
          withWork ? "max-w-[1400px] md:grid md:grid-cols-12 md:items-center md:gap-x-12" : "max-w-[1100px] text-center",
        )}
      >
        <div className={cn(withWork && "text-center md:col-span-6 md:text-start")}>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className={cn(
              "mb-7 font-display leading-[1.08] font-extrabold tracking-tight text-black",
              // Half the screen is the work's: the heading is set for the half
              // it has.
              withWork ? "text-[clamp(36px,3.9vw,60px)]" : "text-[clamp(40px,6.6vw,96px)]",
            )}
          >
            {titleLine1}
            <br />
            <span className="hero-glint">{titleLine2}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className={cn(
              "mb-9 max-w-[720px] font-body text-lg leading-[1.8] text-black/70 md:text-[21px]",
              withWork ? "mx-auto md:mx-0" : "mx-auto",
            )}
          >
            {description}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className={cn("flex justify-center", withWork && "md:justify-start")}
          >
            <Button href="/#cta" className="!border-black !bg-none !bg-black !shadow-none">
              {ctaLabel}
            </Button>
          </motion.div>
        </div>

        {withWork && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="mt-16 flex flex-col gap-10 md:col-span-6 md:mt-0 md:flex-row md:items-start md:gap-6"
          >
            {work.map((item, index) => (
              <div
                key={item.href}
                className={cn(
                  // TWO STAND SIDE BY SIDE, the second set lower, so that the
                  // work is about as tall as the words beside it and the whole
                  // opening is one screen. One over the other, they were a
                  // column twice the height of the screen: the first picture
                  // filled it, and the heading sat in the middle of that
                  // column, at the foot of the screen.
                  "md:min-w-0 md:flex-1",
                  index > 0 && "md:mt-16",
                )}
              >
                <ScrollPiece
                  piece={item.piece}
                  href={item.href}
                  sizes={work.length > 1 ? "(max-width: 768px) 100vw, 24vw" : "(max-width: 768px) 100vw, 46vw"}
                />
                <Link
                  href={item.href}
                  className="group mt-3 inline-flex items-center gap-2 font-display text-m-body font-bold text-black underline-offset-4 hover:underline"
                >
                  {item.name}
                  <ArrowIcon className="transition-transform duration-200 group-hover:-translate-x-1" />
                </Link>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
