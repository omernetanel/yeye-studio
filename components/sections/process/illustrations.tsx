"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/motion/gsap";
import { prepareDrawPaths } from "./draw";

export interface IllustrationProps {
  active: boolean;
}

const STROKE_DIM = "rgba(107,143,248,0.35)";
const STROKE_BRIGHT = "#6b8ff8";

export function DiscoveryIllustration({ active }: IllustrationProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!active || !svgRef.current) return;
    const svg = svgRef.current;

    const ctx = gsap.context(() => {
      const rings = prepareDrawPaths(svg);
      gsap
        .timeline()
        .to(rings, { strokeDashoffset: 0, duration: 1.1, stagger: 0.18, ease: "power2.out" })
        .fromTo(
          "[data-dot]",
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.4, stagger: 0.15, ease: "back.out(2.5)", transformOrigin: "center" },
          "-=0.5"
        );
    }, svg);

    return () => ctx.revert();
  }, [active]);

  return (
    <svg ref={svgRef} width="220" height="220" viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle data-draw cx="110" cy="110" r="95" stroke={STROKE_DIM} strokeWidth="1" />
      <circle data-draw cx="110" cy="110" r="65" stroke={STROKE_DIM} strokeWidth="1" />
      <circle data-draw cx="110" cy="110" r="35" stroke={STROKE_BRIGHT} strokeWidth="1.5" />
      <circle cx="110" cy="110" r="6" fill="#2a33f3" style={{ filter: "drop-shadow(0 0 10px rgba(42,51,243,0.8))" }} />
      <line data-draw x1="110" y1="110" x2="146" y2="82" stroke={STROKE_BRIGHT} strokeWidth="1.5" strokeLinecap="round" />
      <circle data-dot cx="146" cy="82" r="4" fill={STROKE_BRIGHT} />
      <line data-draw x1="110" y1="110" x2="72" y2="152" stroke={STROKE_BRIGHT} strokeWidth="1.5" strokeLinecap="round" />
      <circle data-dot cx="72" cy="152" r="4" fill={STROKE_BRIGHT} opacity="0.8" />
      <line data-draw x1="110" y1="110" x2="45" y2="70" stroke={STROKE_DIM} strokeWidth="1.5" strokeLinecap="round" />
      <circle data-dot cx="45" cy="70" r="4" fill={STROKE_BRIGHT} opacity="0.6" />
    </svg>
  );
}

export function DesignIllustration({ active }: IllustrationProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!active || !svgRef.current) return;
    const svg = svgRef.current;

    const ctx = gsap.context(() => {
      const frame = prepareDrawPaths(svg);
      gsap
        .timeline()
        .to(frame, { strokeDashoffset: 0, duration: 0.9, ease: "power2.out" })
        .fromTo(
          "[data-bar]",
          { scaleX: 0 },
          { scaleX: 1, duration: 0.5, stagger: 0.12, ease: "power2.out", transformOrigin: "right center" },
          "-=0.3"
        )
        .fromTo("[data-cta]", { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.4, ease: "power2.out" }, "-=0.2");
    }, svg);

    return () => ctx.revert();
  }, [active]);

  return (
    <svg ref={svgRef} width="220" height="220" viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect data-draw x="30" y="45" width="160" height="130" rx="12" stroke={STROKE_BRIGHT} strokeWidth="1.5" fill="rgba(42,51,243,0.04)" />
      <rect x="30" y="45" width="160" height="28" rx="12" fill="rgba(42,51,243,0.1)" />
      <circle cx="48" cy="59" r="3.5" fill="#ff5f57" opacity="0.7" />
      <circle cx="61" cy="59" r="3.5" fill="#febc2e" opacity="0.7" />
      <circle cx="74" cy="59" r="3.5" fill="#28c840" opacity="0.7" />
      <rect data-bar x="48" y="92" width="70" height="7" rx="3.5" fill={STROKE_BRIGHT} />
      <rect data-bar x="48" y="110" width="110" height="4" rx="2" fill="rgba(255,255,255,0.16)" />
      <rect data-bar x="48" y="120" width="95" height="4" rx="2" fill="rgba(255,255,255,0.1)" />
      <rect data-cta x="48" y="140" width="64" height="22" rx="6" fill="rgba(42,51,243,0.55)" style={{ filter: "drop-shadow(0 0 8px rgba(42,51,243,0.5))" }} />
    </svg>
  );
}

export function CodeIllustration({ active }: IllustrationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;
    const lines = Array.from(containerRef.current.querySelectorAll<HTMLElement>("[data-line]"));

    const ctx = gsap.context(() => {
      lines.forEach((line) => {
        line.style.width = "0px";
      });
      const timeline = gsap.timeline();
      lines.forEach((line, i) => {
        const target = line.scrollWidth;
        timeline.to(line, { width: target, duration: 0.5, ease: "steps(12)" }, i === 0 ? undefined : "-=0.1");
      });
      timeline.to("[data-cursor]", { opacity: 0, repeat: -1, yoyo: true, duration: 0.5, ease: "steps(1)" });
    }, containerRef.current);

    return () => ctx.revert();
  }, [active]);

  const codeLines = [
    { text: "const", color: "rgba(107,143,248,0.9)", suffix: " studio = {" },
    { text: "  name:", color: "rgba(255,255,255,0.4)", suffix: ' "YEYE LABS"', suffixColor: "rgba(107,243,143,0.85)" },
    { text: "  quality:", color: "rgba(255,255,255,0.4)", suffix: " 100", suffixColor: "rgba(107,243,143,0.85)" },
    { text: "  deliver:", color: "rgba(255,255,255,0.4)", suffix: " true", suffixColor: "rgba(107,243,143,0.85)" },
    { text: "}", color: "rgba(107,143,248,0.9)", suffix: "" },
  ];

  return (
    <div ref={containerRef} className="h-[200px] w-[260px] overflow-hidden rounded-xl border border-primary-light/30 bg-black/80" dir="ltr">
      <div className="flex h-8 items-center gap-1.5 bg-primary/15 px-3">
        <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/70" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/70" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]/70" />
      </div>
      <div className="flex flex-col gap-1.5 p-4 font-mono text-[11px] leading-[1.7]">
        {codeLines.map((line, i) => (
          <div key={i} data-line className="overflow-hidden whitespace-nowrap">
            <span style={{ color: line.color }}>{line.text}</span>
            <span style={{ color: line.suffixColor ?? line.color }}>{line.suffix}</span>
          </div>
        ))}
        <span data-cursor className="mt-0.5 inline-block h-3.5 w-2 rounded-[1px] bg-primary-light" />
      </div>
    </div>
  );
}

export function LaunchIllustration({ active }: IllustrationProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!active || !svgRef.current) return;
    const svg = svgRef.current;

    const ctx = gsap.context(() => {
      const body = prepareDrawPaths(svg);
      gsap
        .timeline()
        .to(body, { strokeDashoffset: 0, duration: 0.9, stagger: 0.1, ease: "power2.out" })
        .to("[data-flame]", { scaleY: 1.15, opacity: 0.9, duration: 0.35, ease: "sine.inOut", repeat: -1, yoyo: true, transformOrigin: "center top" }, "-=0.2")
        .to(svg, { y: -8, duration: 2, ease: "sine.inOut", repeat: -1, yoyo: true }, "-=0.9");
    }, svg);

    return () => ctx.revert();
  }, [active]);

  return (
    <svg ref={svgRef} width="200" height="220" viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        data-draw
        d="M100 30 C100 30 72 68 72 116 L100 134 L128 116 C128 68 100 30 100 30Z"
        stroke={STROKE_BRIGHT}
        strokeWidth="1.5"
        fill="rgba(42,51,243,0.08)"
      />
      <circle data-draw cx="100" cy="88" r="13" stroke={STROKE_BRIGHT} strokeWidth="1.5" fill="rgba(42,51,243,0.2)" />
      <path data-draw d="M72 116 L48 144 L72 139 Z" stroke={STROKE_DIM} strokeWidth="1.5" fill="rgba(42,51,243,0.05)" />
      <path data-draw d="M128 116 L152 144 L128 139 Z" stroke={STROKE_DIM} strokeWidth="1.5" fill="rgba(42,51,243,0.05)" />
      <path
        data-flame
        d="M85 139 C85 139 90 168 100 178 C110 168 115 139 115 139 Z"
        fill="rgba(42,51,243,0.45)"
        style={{ filter: "drop-shadow(0 0 12px rgba(42,51,243,0.7))" }}
      />
    </svg>
  );
}
