"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDocked } from "@/lib/motion/heroDock";
import { cn } from "@/lib/utils";

/**
 * Just the wordmark now — no bar, no links, no CTA. Hidden until the
 * Hero's own pin releases (see lib/motion/heroDock.ts), at which point it
 * crossfades in on its own — tabIndex keeps keyboard focus off an
 * invisible link before that happens. That "docked" flag is only ever
 * flipped by the Hero's own IntersectionObserver, which only exists on
 * the homepage — everywhere else there's no Hero to scroll past, so the
 * logo would otherwise stay invisible forever; those pages just show it
 * immediately instead. mix-blend-difference (against the page content
 * scrolling beneath it, since there's no more opaque bar to sit on) is
 * what makes it read as black over light sections and white over dark
 * ones automatically — the raw asset's opaque pixels are already plain
 * white (see HeroSection's own logo for the same fact), so no color
 * filter is needed here at all.
 */
export default function Navbar() {
  const pathname = usePathname();
  const heroDocked = useDocked();
  const docked = pathname === "/" ? heroDocked : true;

  return (
    <Link
      href="/"
      tabIndex={docked ? 0 : -1}
      aria-label="YEYE"
      className={cn(
        "fixed left-6 top-[22px] z-50 mix-blend-difference transition-opacity duration-200",
        docked ? "opacity-100" : "opacity-0"
      )}
    >
      <Image src="/images/logo.png" alt="YEYE" width={8200} height={3500} className="h-9 w-auto object-contain" priority />
    </Link>
  );
}
