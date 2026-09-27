import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-5 px-6 py-10 text-center md:grid md:h-20 md:grid-cols-3 md:items-center md:gap-6 md:py-0 md:text-inherit">
        {/* Holds the right-hand column of the desktop grid, so the mark stays
            in the middle now that the icons are gone. Nothing on a phone. */}
        <div aria-hidden="true" className="hidden md:block" />

        {/* Logo — center */}
        <div className="flex flex-col items-center gap-1">
          <Image
            src="/images/logo.png"
            alt="YEYE"
            width={8200}
            height={3500}
            className={cn("h-8 w-auto brightness-0", light ? "opacity-40" : "invert-[0.35]")}
          />
          {/* Sits under the footer mark only — the hero wordmark and the
              floating navbar mark are deliberately left as they are. */}
          <span
            className={cn(
              "font-display text-[10px] font-medium tracking-[0.42em] uppercase",
              light ? "text-black/60" : "text-white/60"
            )}
          >
            Digital
          </span>
        </div>

        {/* Copyright, and the three pages that have to be reachable from every
            page of the site. One quiet line rather than a column of links: the
            footer's job here is still the mark. */}
        <div
          className={cn(
            "flex flex-col items-center gap-2 font-display text-m-small md:items-start",
            light ? "text-black/60" : "text-white/60"
          )}
        >
          <div className="flex items-center gap-3">
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
          </div>
          <span>© 2026 YEYE Digital. כל הזכויות שמורות.</span>
        </div>
      </div>
    </footer>
  );
}
