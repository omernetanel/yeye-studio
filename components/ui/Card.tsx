import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Renders a light glass panel (for white-background sections) instead of the default dark theme. */
  light?: boolean;
  /** Only matters when `light` — the panel's fill and corner-glow color. "neutral" is a solid
   *  white with a soft black glow, for sections (like Services, sitting over video/imagery) where
   *  a pop of brand blue would clash with the background instead of just accenting the card. */
  tone?: "accent" | "neutral";
}

/** Shared "glass panel" chrome for cards across the site — background, border, blur, corner glow. */
export default function Card({ children, className, light = false, tone = "accent" }: CardProps) {
  return (
    <div
      className={cn(
        "relative h-full overflow-hidden rounded-2xl p-7",
        light
          ? cn("border border-black/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]", tone === "neutral" ? "bg-white" : "bg-white/30")
          : "border border-primary-light/10 bg-surface/80 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0",
          light
            ? tone === "neutral"
              ? "bg-[radial-gradient(ellipse_at_100%_100%,rgba(0,0,0,0.05)_0%,transparent_70%)]"
              : "bg-[radial-gradient(ellipse_at_100%_100%,color-mix(in_srgb,var(--color-accent)_13%,transparent)_0%,transparent_70%)]"
            : "bg-[radial-gradient(ellipse_at_100%_100%,color-mix(in_srgb,var(--color-primary-light)_13%,transparent)_0%,transparent_70%)]"
        )}
      />
      {/*
        Callers pass layout classes (flex, items-center, gap, text-align)
        expecting them to govern the actual card content — they need to land
        here, on the wrapper around {children}, not on the outer chrome div
        above. Applied there, they only ever centered/spaced this wrapper
        itself (the outer div's one real child), not the icon/title/text
        nested inside it, which is why icons and content sat flush to one
        side instead of centered across every card on the site.
      */}
      <div className={cn("relative z-10", className)}>{children}</div>
    </div>
  );
}
