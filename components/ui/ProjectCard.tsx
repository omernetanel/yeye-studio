"use client";

import Image from "next/image";
import Link from "next/link";

interface ProjectCardProps {
  title: string;
  category: string;
  imageSrc: string;
  href?: string;
}

export default function ProjectCard({ title, category, imageSrc, href = "#" }: ProjectCardProps) {
  return (
    <Link
      href={href}
      style={{ display: "block", textDecoration: "none", transition: "transform 0.2s ease" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.02)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {/* Image */}
      <div style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1672/941",
        borderRadius: "12px",
        overflow: "hidden",
        backgroundColor: "#111111",
        border: "1px solid #1e1e1e",
        marginBottom: "14px",
      }}>
        <Image
          src={imageSrc}
          alt={title}
          fill
          style={{ objectFit: "cover", objectPosition: "top" }}
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>

      {/* Info */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 4px",
        direction: "rtl",
      }}>
        <span style={{
          fontFamily: "'GoogleSans', Arial, sans-serif",
          fontSize: "13px",
          color: "rgba(255,255,255,0.42)",
        }}>
          {category}
        </span>
        <span style={{
          fontFamily: "'GoogleSans', Arial, sans-serif",
          fontWeight: 700,
          fontSize: "17px",
          color: "white",
        }}>
          {title}
        </span>
      </div>
    </Link>
  );
}
