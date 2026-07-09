"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import ShimmerButton from "@/components/ui/ShimmerButton";

const navLinks = [
  { label: "עבודות", href: "/#projects" },
  { label: "שירותים", href: "/#services" },
  { label: "אודות", href: "/#about" },
];

export default function Navbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        backgroundColor: "rgba(10,10,10,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 24px",
          height: "68px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          direction: "rtl",
        }}
      >
        {/* Logo — left */}
        <div style={{ position: "absolute", left: "24px", top: "50%", transform: "translateY(-50%)" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center" }}>
            <Image
              src="/images/logo.png"
              alt="YEYE Studio"
              width={80}
              height={26}
              style={{ height: "24px", width: "auto", aspectRatio: "80 / 26", objectFit: "contain", filter: "brightness(10)" }}
              priority
            />
          </Link>
        </div>

        {/* Nav links — perfectly centered */}
        <nav style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          alignItems: "center",
          gap: "36px",
        }}>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}
              style={{
                fontSize: "15px",
                fontFamily: "'GoogleSans', Arial, sans-serif",
                fontWeight: 500,
                color: "rgba(255,255,255,0.62)",
                textDecoration: "none",
                transition: "color 0.2s",
                position: "relative",
                paddingBottom: "4px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#2a33f3";
                const line = e.currentTarget.querySelector(".nav-underline") as HTMLElement;
                if (line) line.style.width = "100%";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.62)";
                const line = e.currentTarget.querySelector(".nav-underline") as HTMLElement;
                if (line) line.style.width = "0%";
              }}
            >
              {link.label}
              <span className="nav-underline" style={{
                position: "absolute",
                bottom: "-24px",
                left: 0,
                width: "0%",
                height: "2px",
                background: "linear-gradient(90deg, #2a33f3, #6B8FF8)",
                borderRadius: "2px",
                transition: "width 0.25s ease",
              }} />
            </Link>
          ))}
        </nav>

        {/* CTA Button — right */}
        <div style={{ position: "absolute", right: "24px", top: "50%", transform: "translateY(-50%)" }}>
          <ShimmerButton href="/contact" variant="primary" style={{ fontSize: "13px", padding: "8px 16px" }}>התחל פרויקט</ShimmerButton>
        </div>
      </div>
    </motion.header>
  );
}
