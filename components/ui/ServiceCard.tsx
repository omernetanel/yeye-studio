"use client";

import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { type MouseEvent } from "react";
import Card from "./Card";

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
}

export default function ServiceCard({ icon: Icon, title, description, href }: ServiceCardProps) {
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
      <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }} className="h-full">
        <Card className="flex h-full flex-col items-center gap-4 text-center">
          <div
            style={{ transform: "translateZ(20px)" }}
            className="flex h-16 w-16 items-center justify-center rounded-full border border-primary-light/25 bg-[radial-gradient(circle_at_30%_30%,color-mix(in_srgb,var(--color-primary)_35%,transparent)_0%,rgba(20,20,30,0.4)_75%)]"
          >
            <Icon size={30} strokeWidth={1.5} className="text-primary-light drop-shadow-[0_0_6px_rgba(42,51,243,0.7)]" />
          </div>

          <h3 style={{ transform: "translateZ(20px)" }} className="font-display text-xl font-bold text-white">
            {title}
          </h3>

          <p
            style={{ transform: "translateZ(15px)" }}
            className="flex-1 whitespace-pre-line font-body text-[14.5px] leading-[1.75] text-white/50"
          >
            {description}
          </p>

          <span
            style={{ transform: "translateZ(15px)" }}
            className="flex items-center justify-center gap-1.5 font-display text-sm text-primary-light transition-transform duration-200 group-hover:scale-105"
          >
            <span aria-hidden>←</span>
            לפרטים נוספים
          </span>
        </Card>
      </motion.div>
    </Link>
  );
}
