"use client";

import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
}

export default function ServiceCard({ icon: Icon, title, description, href = "#" }: ServiceCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rawRotateX = useTransform(y, [-60, 60], [10, -10]);
  const rawRotateY = useTransform(x, [-60, 60], [-10, 10]);
  const rotateX = useSpring(rawRotateX, { stiffness: 200, damping: 20 });
  const rotateY = useSpring(rawRotateY, { stiffness: 200, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div style={{ perspective: "1000px", height: "100%" }}>
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          position: "relative",
          background: "linear-gradient(180deg, rgba(20,20,28,0.75) 0%, rgba(13,13,18,0.85) 100%)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: "20px",
          border: "1px solid rgba(107,143,248,0.1)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), inset 0 0 0 1px rgba(107,143,248,0.06)",
          padding: "28px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          direction: "rtl",
          height: "100%",
          textAlign: "center",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        {/* Corner glow — subtle depth accent */}
        <div style={{
          position: "absolute",
          bottom: "0",
          right: "0",
          width: "150px",
          height: "150px",
          background: "radial-gradient(ellipse at 100% 100%, rgba(107,143,248,0.13) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Icon in glowing gradient circle */}
        <div style={{
          position: "relative",
          zIndex: 1,
          transform: "translateZ(20px)",
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 30% 30%, rgba(42,51,243,0.35) 0%, rgba(20,20,30,0.4) 75%)",
          border: "1px solid rgba(107,143,248,0.25)",
          boxShadow: "0 0 18px rgba(42,51,243,0.35), inset 0 1px 1px rgba(255,255,255,0.15)",
        }}>
          <Icon
            size={30}
            strokeWidth={1.5}
            color="#6B8FF8"
            style={{ filter: "drop-shadow(0 0 6px rgba(42,51,243,0.7))" }}
          />
        </div>

        {/* Title */}
        <h3 style={{
          position: "relative",
          zIndex: 1,
          transform: "translateZ(20px)",
          fontFamily: "'GoogleSans', Arial, sans-serif",
          fontWeight: 700,
          fontSize: "20px",
          color: "white",
          lineHeight: 1.3,
        }}>
          {title}
        </h3>

        {/* Description */}
        <p style={{
          position: "relative",
          zIndex: 1,
          transform: "translateZ(15px)",
          fontFamily: "'Assistant', Arial, sans-serif",
          fontSize: "14.5px",
          color: "rgba(255,255,255,0.5)",
          lineHeight: 1.75,
          flex: 1,
          whiteSpace: "pre-line",
        }}>
          {description}
        </p>

        {/* Link */}
        <Link
          href={href}
          style={{
            position: "relative",
            zIndex: 1,
            transform: "translateZ(15px)",
            fontFamily: "'GoogleSans', Arial, sans-serif",
            fontSize: "14px",
            color: "#6B8FF8",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            direction: "rtl",
            transition: "transform 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateZ(15px) scale(1.06)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateZ(15px) scale(1)";
          }}
        >
          <span>←</span>
          <span>לפרטים נוספים</span>
        </Link>
      </motion.div>
    </div>
  );
}
