"use client";

import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { type MouseEvent } from "react";
import Card from "./Card";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  /** Renders for a white-background section (dark text) instead of the default dark theme (white text). */
  light?: boolean;
  /** See Card's `tone` — "neutral" drops the brand-blue accent (icon circle, icon glow, link color)
   *  in favor of black/gray, for sections where blue would clash with the backdrop. */
  tone?: "accent" | "neutral";
}

export default function ServiceCard({ icon: Icon, title, description, href, light = true, tone = "accent" }: ServiceCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-60, 60], [10, -10]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-60, 60], [-10, 10]), { stiffness: 200, damping: 20 });

  const handleMouseMove = (event: MouseEvent<HTMLAnchorElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left - rect.width / 2);
    y.set(event.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <Link
      href={href}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group block h-full [perspective:1000px]"
    >
      {/*
        A single tilt on the whole card, not per-element translateZ depth
        layering — the latter only projects correctly if every element
        between here and the icon has transform-style: preserve-3d, which
        Card's own wrapper doesn't set. Under that broken chain, perspective
        projection shifted each translateZ'd child sideways by an amount
        that varied with the card's content height, so icons landed
        off-center by a different amount on every card.
      */}
      <motion.div style={{ rotateX, rotateY }} className="h-full">
        <Card light={light} tone={tone} className="flex h-full flex-col items-center gap-4 text-center">
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full border",
              tone === "neutral"
                ? "border-black/10 bg-[radial-gradient(circle_at_30%_30%,rgba(0,0,0,0.08)_0%,rgba(255,255,255,0.4)_75%)]"
                : "border-accent/25 bg-[radial-gradient(circle_at_30%_30%,color-mix(in_srgb,var(--color-accent)_35%,transparent)_0%,rgba(255,255,255,0.4)_75%)]"
            )}
          >
            <Icon
              size={26}
              strokeWidth={1.5}
              className={tone === "neutral" ? "text-black/70" : "text-accent drop-shadow-[0_0_6px_rgba(74,74,74,0.35)]"}
            />
          </div>

          <h3 className={cn("font-display text-lg font-bold", light ? "text-black" : "text-white")}>{title}</h3>

          <p className={cn("flex-1 whitespace-pre-line font-body text-[13.5px] leading-[1.75]", light ? "text-black/55" : "text-white/55")}>
            {description}
          </p>

          <span
            className={cn(
              "mt-1.5 flex items-center justify-center gap-1.5 font-display text-sm transition-transform duration-200 group-hover:scale-105",
              tone === "neutral" ? "text-black/70" : "text-accent"
            )}
          >
            <span aria-hidden>←</span>
            לפרטים נוספים
          </span>
        </Card>
      </motion.div>
    </Link>
  );
}
