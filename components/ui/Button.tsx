import Link from "next/link";
import { type MouseEventHandler, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import ArrowIcon from "./ArrowIcon";

type ButtonVariant = "primary" | "outline" | "ghost";

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  showArrow?: boolean;
  className?: string;
  /** Renders as a Link when set, otherwise as a native <button>. */
  href?: string;
  type?: "button" | "submit";
  onClick?: MouseEventHandler;
  disabled?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-white/15 bg-[image:var(--gradient-brand-diagonal)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]",
  outline: "border border-white/20 bg-transparent text-white/80 hover:border-white/35",
  ghost: "border border-transparent bg-transparent text-white/60 hover:text-white",
};

const baseClasses =
  "btn-shimmer inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-6 py-[11px] font-display text-sm font-medium transition-transform duration-200 ease-out hover:scale-[1.04] active:scale-100 disabled:cursor-wait disabled:opacity-70 disabled:hover:scale-100";

export default function Button({
  children,
  variant = "primary",
  showArrow = true,
  className,
  href,
  type = "button",
  onClick,
  disabled,
}: ButtonProps) {
  const classes = cn(baseClasses, variantClasses[variant], className);

  if (href) {
    return (
      <Link href={href} className={classes}>
        <span>{children}</span>
        {showArrow && <ArrowIcon />}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      <span>{children}</span>
      {showArrow && <ArrowIcon />}
    </button>
  );
}
