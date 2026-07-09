"use client";

import Link from "next/link";
import { useRef } from "react";
import ArrowIcon from "@/components/ui/ArrowIcon";

interface ShimmerButtonProps {
  href: string;
  variant?: "primary" | "outline";
  children: string;
  style?: React.CSSProperties;
}

export default function ShimmerButton({ href, variant = "primary", children, style }: ShimmerButtonProps) {
  const shimmerRef = useRef<HTMLSpanElement>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.transform = "scale(1.04)";
    if (shimmerRef.current) {
      shimmerRef.current.style.animation = "none";
      shimmerRef.current.offsetHeight;
      shimmerRef.current.style.animation = "shimmerSlide 1.1s ease forwards";
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.transform = "scale(1)";
  };

  const base: React.CSSProperties = {
    position: "relative",
    overflow: "hidden",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontFamily: "'GoogleSans', Arial, sans-serif",
    fontWeight: 500,
    padding: "11px 24px",
    borderRadius: "8px",
    textDecoration: "none",
    direction: "rtl",
    whiteSpace: "nowrap",
    transition: "transform 0.2s ease",
    cursor: "pointer",
  };

  const primaryStyle: React.CSSProperties = {
    ...base,
    background: "linear-gradient(160deg, #6B8FF8 0%, #2a33f3 50%, #1e28d4 100%)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.15)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)",
    ...style,
  };

  const outlineStyle: React.CSSProperties = {
    ...base,
    backgroundColor: "transparent",
    color: "rgba(255,255,255,0.78)",
    border: "1px solid rgba(255,255,255,0.2)",
    ...style,
  };

  return (
    <Link
      href={href}
      style={variant === "primary" ? primaryStyle : outlineStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span>{children}</span>
      <ArrowIcon />
      <span
        ref={shimmerRef}
        style={{
          position: "absolute",
          top: "-50%",
          left: "-75%",
          width: "40%",
          height: "200%",
          background: "linear-gradient(to right, transparent, rgba(255,255,255,0.10), transparent)",
          transform: "rotate(25deg)",
          pointerEvents: "none",
        }}
      />
    </Link>
  );
}
