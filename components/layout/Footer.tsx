import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import InstagramLink from "@/components/ui/InstagramLink";

const LEGAL_LINKS = [
  { label: "פרטיות", href: "/privacy" },
  { label: "נגישות", href: "/accessibility" },
  { label: "תנאי שימוש", href: "/terms" },
];

interface FooterProps {
  /** Renders for a white-background page instead of the default dark theme. */
  light?: boolean;
}

export default function Footer({ light = false }: FooterProps) {
  return (
    <footer className={cn("border-t", light ? "border-black/8" : "border-white/6")}>
      {/* NO CONTACT ICONS. The footer used to carry a WhatsApp and a mail link,
          and on the homepage the floating WhatsApp button already sits in the
          corner of every screen — so the page ended on the same way in twice,
          one of them a tiny icon. What is left is the mark and the line. */}
      {/* THREE PARTS, ONE PER COLUMN: the pages at the start, the mark in the
          middle, the line at the end. Both text blocks used to share the end
          column with an empty spacer opposite them, which left the row weighted
          to one side and the mark not actually centred between anything.
          On a phone it stacks, and the mark goes first - there it leads rather
          than separates. */}
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-5 px-6 py-10 text-center md:grid md:h-20 md:grid-cols-3 md:items-center md:gap-6 md:py-0 md:text-inherit">
        {/* The three pages that have to be reachable from every page of the
            site. One quiet line rather than a column of links: the footer's job
            here is still the mark. */}
        <div
          className={cn(
            // 12px against the m-small 13 the rest of the site's fine print
            // uses: this row is a legal necessity at the very foot of the page,
            // and it should read as the quietest thing on it.
            "flex items-center gap-3 font-display text-[12px] md:justify-self-start",
            light ? "text-black/60" : "text-white/60"
          )}
        >
          {LEGAL_LINKS.map((link, index) => (
            <span key={link.href} className="flex items-center gap-3">
              <Link
                href={link.href}
                className={cn("transition-colors", light ? "hover:text-black" : "hover:text-white")}
              >
                {link.label}
              </Link>
              {index < LEGAL_LINKS.length - 1 && (
                <span aria-hidden="true" className={light ? "text-black/25" : "text-white/25"}>
                  ·
                </span>
              )}
            </span>
          ))}
          {/* The studio's Instagram closes the row - the one outward link the
              footer carries (see NO CONTACT ICONS above: WhatsApp is already in
              the corner of every screen, Instagram is not). It stood beside the
              copyright line at the other end, alone; here it is with the rest of
              what can be pressed. */}
          <span aria-hidden="true" className={light ? "text-black/25" : "text-white/25"}>
            ·
          </span>
          <InstagramLink size={16} className={light ? "hover:text-black" : "hover:text-white"} />
        </div>

        {/* Logo — center */}
        <div className="order-first flex flex-col items-center gap-1 md:order-none">
          <Image
            src="/images/logo.png"
            alt="YEYE"
            width={8200}
            height={3500}
            className={cn("h-8 w-auto brightness-0", light ? "opacity-40" : "invert-[0.35]")}
          />
          {/* Sits under the footer mark only — the hero wordmark and the
              floating navbar mark are deliberately left as they are.
              THE MARK'S OWN VALUE, not a darker grey beside it: the wordmark
              above is black at 40% on a light page and the same amount of white
              on a dark one, and a 60% line under it read as a caption attached
              to the logo rather than as part of it.
              The indent is the letter-spacing coming back: 0.42em is added
              after every letter including the last, so the word sits that much
              left of centre until the same amount is put back in front of it.
              dir="ltr" is what makes that true: in the page's right-to-left
              flow the indent went on the RIGHT, the same side as the trailing
              spacing, and the two added up instead of cancelling. */}
          <span
            dir="ltr"
            className={cn(
              "indent-[0.42em] font-display text-[11px] font-medium tracking-[0.42em] uppercase",
              light ? "text-black/40" : "text-white/35"
            )}
          >
            Digital
          </span>
        </div>

        {/* The line. */}
        <div
          className={cn("font-display text-[12px] md:justify-self-end", light ? "text-black/60" : "text-white/60")}
        >
          <span>© 2026 YEYE Digital. כל הזכויות שמורות.</span>
        </div>
      </div>
    </footer>
  );
}
