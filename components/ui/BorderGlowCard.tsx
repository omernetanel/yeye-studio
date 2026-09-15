import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A card with a light that travels slowly around its border.
 *
 * The idea is React Bits' BorderGlow (MIT); the drawing here is not theirs. The
 * original aims a cone of light with the mouse pointer, and these cards are only
 * ever on a phone — so what is left is the light itself, turned by a CSS
 * animation. See `.border-glow` in app/globals.css for why it is a rotating
 * element rather than a rotating gradient.
 *
 * Four layers, in paint order, and the order is the whole trick:
 *
 *   sweep  — an oversized disc carrying one bright arc, turning.
 *   edge   — the same disc, blurred, so the light has a soft side.
 *   face   — the card's black face, inset a pixel and a half, over BOTH discs.
 *            What is left showing of them is that ring: the lit border.
 *   content— the card's own children, above all of it.
 */
export default function BorderGlowCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-glow", className)}>
      <span aria-hidden="true" className="border-glow-sweep" />
      <span aria-hidden="true" className="border-glow-edge">
        <span className="border-glow-sweep" />
      </span>
      <span aria-hidden="true" className="border-glow-face" />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
