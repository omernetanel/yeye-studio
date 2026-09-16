import Image from "next/image";
import { cn } from "@/lib/utils";

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
              light ? "text-black/35" : "text-white/35"
            )}
          >
            Digital
          </span>
        </div>

        {/* Copyright */}
        <div className={cn("font-display text-m-small", light ? "text-black/35" : "text-white/35")}>
          © 2026 YEYE Digital. כל הזכויות שמורות.
        </div>
      </div>
    </footer>
  );
}
