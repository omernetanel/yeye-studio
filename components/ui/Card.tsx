import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
}

/** Shared "glass panel" chrome for cards across the site — background, border, blur, corner glow. */
export default function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-primary-light/10 bg-surface/80 p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-xl",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_100%_100%,color-mix(in_srgb,var(--color-primary-light)_13%,transparent)_0%,transparent_70%)]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
