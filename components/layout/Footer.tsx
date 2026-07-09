import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid rgba(255,255,255,0.06)",
      backgroundColor: "transparent",
    }}>
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "0 24px",
        height: "80px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        direction: "rtl",
      }}>
        {/* Social Icons — rightmost in RTL */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <Link href="https://instagram.com" target="_blank" rel="noopener noreferrer"
            aria-label="Instagram"
            style={{ color: "rgba(255,255,255,0.45)", display: "flex" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
            </svg>
          </Link>
          <Link href="https://wa.me/" target="_blank" rel="noopener noreferrer"
            aria-label="WhatsApp"
            style={{ color: "rgba(255,255,255,0.45)", display: "flex" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
          </Link>
          <Link href="mailto:hello@yeyestudio.com"
            aria-label="Email"
            style={{ color: "rgba(255,255,255,0.45)", display: "flex" }}>
            <Mail size={20} strokeWidth={1.5} />
          </Link>
        </div>

        {/* Logo + Studio — center */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
          <Image
            src="/images/logo.png"
            alt="YEYE Studio"
            width={56}
            height={20}
            style={{ height: "20px", width: "auto", filter: "brightness(0) invert(0.35)" }}
          />
          <span style={{
            fontSize: "10px",
            fontFamily: "'GoogleSans', Arial, sans-serif",
            letterSpacing: "0.2em",
            color: "rgba(255,255,255,0.35)",
            fontWeight: 400,
            textTransform: "uppercase",
          }}>
            STUDIO
          </span>
        </div>

        {/* Copyright — leftmost in RTL */}
        <div style={{
          fontSize: "13px",
          fontFamily: "'GoogleSans', Arial, sans-serif",
          color: "rgba(255,255,255,0.35)",
          direction: "rtl",
        }}>
          © 2026 YEYE Studio. כל הזכויות שמורות.
        </div>
      </div>
    </footer>
  );
}
