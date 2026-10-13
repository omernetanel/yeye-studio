"use client";

import { useRef } from "react";
import Link from "next/link";
import ArrowIcon from "@/components/ui/ArrowIcon";
import ServiceHeading from "@/components/services/ServiceHeading";
import { ScrollPiece, useScrollPieces } from "@/components/ui/ScrollPiece";
import type { DesignPiece } from "@/lib/design-work";

export interface ServiceWorkItem {
  name: string;
  /** The work's own page on this site. */
  href: string;
  piece: DesignPiece;
}

/**
 * Work of the kind a service page is about, each picture a way into its own
 * page: what the page has been describing, shown. Two columns that do not line
 * up on a desk, as on the home page, and one on a phone; the pictures move
 * with the scroll the way they do there.
 *
 * A service with nothing to show yet simply does not have this block.
 */
export default function ServiceWork({ title, items }: { title: string; items: ServiceWorkItem[] }) {
  const rootRef = useRef<HTMLElement>(null);
  useScrollPieces(rootRef);

  return (
    <section ref={rootRef} className="px-6 py-16">
      <div className="mx-auto max-w-[1100px]">
        <ServiceHeading className="mb-12">{title}</ServiceHeading>
        {/* One piece of work stands alone in the middle; two stand side by
            side, the second lower. */}
        <div className={items.length === 1 ? "mx-auto max-w-[760px]" : "grid gap-12 sm:grid-cols-2 sm:gap-x-10"}>
          {items.map((item, index) => (
            <Link key={item.href} href={item.href} className={`group block ${index % 2 === 1 ? "sm:mt-24" : ""}`}>
              <ScrollPiece piece={item.piece} sizes="(max-width: 640px) 100vw, 520px" />
              <span className="mt-4 inline-flex items-center gap-2 font-display text-lg font-bold text-black underline-offset-4 group-hover:underline">
                {item.name}
                <ArrowIcon className="transition-transform duration-200 group-hover:-translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
