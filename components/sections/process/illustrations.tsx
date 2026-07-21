"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/motion/gsap";
import { prepareDrawPaths } from "./draw";

export interface IllustrationProps {
  active: boolean;
}

const STROKE_DIM = "rgba(107,143,248,0.35)";
const STROKE_BRIGHT = "#6b8ff8";

// Three spokes, each ending exactly on one of the three rings (so the dot
// visibly sits on that ring's edge, not floating past all of them), at
// 120° apart for a clean, symmetric starting position.
const DISCOVERY_CENTER = 110;
const DISCOVERY_RING_RADII = [95, 65, 35];
const DISCOVERY_START_ANGLES = [-90, 30, 150];

export function DiscoveryIllustration({ active }: IllustrationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const CENTER = DISCOVERY_CENTER;
  const spokes = DISCOVERY_START_ANGLES.map((deg, i) => {
    const rad = (deg * Math.PI) / 180;
    const r = DISCOVERY_RING_RADII[i];
    return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
  });

  useEffect(() => {
    if (!active || !svgRef.current) return;
    const svg = svgRef.current;

    const ctx = gsap.context(() => {
      const rings = prepareDrawPaths(svg);
      const timeline = gsap.timeline();

      timeline
        .to(rings, { strokeDashoffset: 0, duration: 1.1, stagger: 0.18, ease: "power2.out" })
        .fromTo(
          "[data-dot]",
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.4, stagger: 0.15, ease: "back.out(2.5)", transformOrigin: "center" },
          "-=0.5"
        );

      // Once drawn in, each spoke keeps orbiting its own ring indefinitely —
      // like satellites at different distances, moving at different speeds.
      // Driven by recomputing x/y from a plain angle value every frame
      // (rather than an SVG/CSS rotation transform) so the radius is
      // mathematically pinned to the ring and can never drift over time.
      const durations = [6, 9, 13];
      DISCOVERY_START_ANGLES.forEach((startDeg, i) => {
        const r = DISCOVERY_RING_RADII[i];
        const line = svg.querySelector<SVGLineElement>(`[data-orbit="${i}"] line`);
        const dot = svg.querySelector<SVGCircleElement>(`[data-orbit="${i}"] circle`);
        if (!line || !dot) return;
        const state = { angle: startDeg };
        const direction = i % 2 === 0 ? 1 : -1;
        timeline.to(
          state,
          {
            angle: startDeg + direction * 360,
            duration: durations[i],
            ease: "none",
            repeat: -1,
            onUpdate: () => {
              const rad = (state.angle * Math.PI) / 180;
              const x = DISCOVERY_CENTER + r * Math.cos(rad);
              const y = DISCOVERY_CENTER + r * Math.sin(rad);
              line.setAttribute("x2", String(x));
              line.setAttribute("y2", String(y));
              dot.setAttribute("cx", String(x));
              dot.setAttribute("cy", String(y));
            },
          },
          "-=0.2"
        );
      });
    }, svg);

    return () => ctx.revert();
  }, [active]);

  return (
    <svg ref={svgRef} width="380" height="380" viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle data-draw cx="110" cy="110" r="95" stroke={STROKE_DIM} strokeWidth="1" />
      <circle data-draw cx="110" cy="110" r="65" stroke={STROKE_DIM} strokeWidth="1" />
      <circle data-draw cx="110" cy="110" r="35" stroke={STROKE_BRIGHT} strokeWidth="1.5" />
      <circle cx="110" cy="110" r="6" fill="#2a33f3" style={{ filter: "drop-shadow(0 0 10px rgba(42,51,243,0.8))" }} />
      {spokes.map((p, i) => (
        <g key={i} data-orbit={i}>
          <line
            data-draw
            x1={CENTER}
            y1={CENTER}
            x2={p.x}
            y2={p.y}
            stroke={STROKE_BRIGHT}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle data-dot cx={p.x} cy={p.y} r="4" fill={STROKE_BRIGHT} />
        </g>
      ))}
    </svg>
  );
}

const DESIGN_LINES = [
  { x: 45, y: 92, width: 100 },
  { x: 45, y: 118, width: 130 },
  { x: 45, y: 144, width: 80 },
];
const DESIGN_CTA = { x: 140, y: 164, width: 50, height: 20 };

export function DesignIllustration({ active }: IllustrationProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!active || !svgRef.current) return;
    const svg = svgRef.current;
    const pencil = svg.querySelector<SVGGElement>("[data-pencil]");

    const ctx = gsap.context(() => {
      const frame = prepareDrawPaths(svg);
      const timeline = gsap.timeline();

      timeline.to(frame, { strokeDashoffset: 0, duration: 0.8, ease: "power2.out" });

      if (pencil) {
        gsap.set(pencil, { x: DESIGN_LINES[0].x, y: DESIGN_LINES[0].y + 4 });
        timeline.to(pencil, { opacity: 1, duration: 0.2 }, "-=0.1");

        DESIGN_LINES.forEach((line, i) => {
          timeline
            .to(
              pencil,
              { x: line.x + line.width, y: line.y + 4, duration: 0.5, ease: "power1.inOut" },
              i === 0 ? undefined : "-=0.1"
            )
            .to(`[data-line="${i}"]`, { attr: { width: line.width }, duration: 0.5, ease: "power1.inOut" }, "<");
        });

        // Once done writing, the pencil moves to rest beside the button
        // instead of hovering over the text it just wrote — reads as
        // "and here's the result," with the two connected, rather than
        // floating disconnected over the last line.
        timeline.addLabel("linesDone");
        timeline.to(
          pencil,
          { x: DESIGN_CTA.x - 10, y: DESIGN_CTA.y + DESIGN_CTA.height / 2, duration: 0.5, ease: "power1.inOut" },
          "linesDone"
        );
        timeline.to(pencil, { y: "+=5", duration: 1.1, ease: "sine.inOut", repeat: -1, yoyo: true }, "linesDone+=0.6");
      }

      timeline.fromTo(
        "[data-cta]",
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2.2)", transformOrigin: "center" },
        pencil ? "linesDone+=0.2" : "-=0.3"
      );
    }, svg);

    return () => ctx.revert();
  }, [active]);

  return (
    <svg ref={svgRef} width="380" height="380" viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect data-draw x="25" y="40" width="170" height="150" rx="14" stroke={STROKE_BRIGHT} strokeWidth="1.5" fill="rgba(42,51,243,0.04)" />
      <rect x="25" y="40" width="170" height="28" rx="14" fill="rgba(42,51,243,0.1)" />
      <circle cx="43" cy="54" r="3.5" fill="#ff5f57" opacity="0.7" />
      <circle cx="56" cy="54" r="3.5" fill="#febc2e" opacity="0.7" />
      <circle cx="69" cy="54" r="3.5" fill="#28c840" opacity="0.7" />
      {DESIGN_LINES.map((line, i) => (
        <rect
          key={i}
          data-line={i}
          x={line.x}
          y={line.y}
          width={0}
          height="8"
          rx="4"
          fill={i === 0 ? STROKE_BRIGHT : "rgba(255,255,255,0.14)"}
        />
      ))}
      <rect
        data-cta
        x={DESIGN_CTA.x}
        y={DESIGN_CTA.y}
        width={DESIGN_CTA.width}
        height={DESIGN_CTA.height}
        rx="6"
        fill="rgba(42,51,243,0.55)"
        style={{ filter: "drop-shadow(0 0 8px rgba(42,51,243,0.5))" }}
      />
      <g data-pencil style={{ opacity: 0 }}>
        <g transform="rotate(-35)">
          <path d="M-3 -6 L3 -6 L0 0 Z" fill="#3a2a1a" />
          <rect x="-3" y="-24" width="6" height="18" rx="1" fill="#ffb020" />
          <rect x="-3" y="-24" width="6" height="3" fill="#e8a415" />
          <rect x="-3" y="-30" width="6" height="6" rx="2" fill="#ff6b5f" />
        </g>
      </g>
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
    <div ref={containerRef} className="h-[340px] w-[420px] overflow-hidden rounded-xl border border-primary-light/30 bg-black/80" dir="ltr">
      <div className="flex h-12 items-center gap-2 bg-primary/15 px-5">
        <div className="h-3.5 w-3.5 rounded-full bg-[#ff5f57]/70" />
        <div className="h-3.5 w-3.5 rounded-full bg-[#febc2e]/70" />
        <div className="h-3.5 w-3.5 rounded-full bg-[#28c840]/70" />
      </div>
      <div className="flex flex-col gap-2 p-7 font-mono text-[17px] leading-[1.3]">
        {codeLines.map((line, i) => (
          <div key={i} data-line className="overflow-hidden whitespace-nowrap">
            <span style={{ color: line.color }}>{line.text}</span>
            <span style={{ color: line.suffixColor ?? line.color }}>{line.suffix}</span>
          </div>
        ))}
        <span data-cursor className="mt-0.5 inline-block h-4 w-2.5 rounded-[1px] bg-primary-light" />
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
        .to(
          "[data-flame-outer]",
          { scaleY: 1.18, opacity: 0.7, duration: 0.4, ease: "sine.inOut", repeat: -1, yoyo: true, transformOrigin: "center top" },
          "-=0.2"
        )
        .to(
          "[data-flame-inner]",
          { scaleY: 1.3, opacity: 1, duration: 0.26, ease: "sine.inOut", repeat: -1, yoyo: true, transformOrigin: "center top" },
          "<0.05"
        )
        .to(
          "[data-spark]",
          {
            keyframes: { opacity: [0, 1, 0], y: [0, -12, -26] },
            duration: 1.2,
            ease: "power1.out",
            repeat: -1,
            repeatDelay: 0.25,
            stagger: 0.45,
          },
          "-=0.3"
        )
        .to(svg, { y: -8, duration: 2, ease: "sine.inOut", repeat: -1, yoyo: true }, "-=0.9");
    }, svg);

    return () => ctx.revert();
  }, [active]);

  return (
    <svg ref={svgRef} width="345" height="380" viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        data-flame-outer
        d="M85 139 C85 139 90 172 100 184 C110 172 115 139 115 139 Z"
        fill="#6b5cf6"
        opacity="0.55"
        style={{ filter: "drop-shadow(0 0 14px rgba(107,92,246,0.65))" }}
      />
      <path
        data-flame-inner
        d="M92 139 C92 139 95 162 100 172 C105 162 108 139 108 139 Z"
        fill="#ffb020"
        opacity="0.9"
        style={{ filter: "drop-shadow(0 0 8px rgba(255,176,32,0.7))" }}
      />
      <circle data-spark cx="93" cy="148" r="1.6" fill="#ffb020" opacity="0" />
      <circle data-spark cx="107" cy="151" r="1.3" fill="#ff8a3d" opacity="0" />
      <circle data-spark cx="100" cy="155" r="1.4" fill="#ffd27a" opacity="0" />
    </svg>
  );
}
