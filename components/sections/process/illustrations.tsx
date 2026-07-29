"use client";

import { useEffect, useRef } from "react";
import { Compass, Swords, Target, Users, type LucideIcon } from "lucide-react";
import { gsap } from "@/lib/motion/gsap";
import { prepareDrawPaths } from "./draw";

export interface IllustrationProps {
  active: boolean;
}

const STROKE_DIM = "rgba(154,154,154,0.35)";
const STROKE_BRIGHT = "#9a9a9a";

// Four facts the studio learns about a business before writing any code.
// Real CSS 3D (perspective + rotateY, not a simulated flip) turns each one
// face-down to face-up in sequence — literal cards being examined, rather
// than an abstract shape with no connection to "getting to know a business."
const DISCOVERY_CARDS: { icon: LucideIcon; label: string }[] = [
  { icon: Target, label: "מטרות" },
  { icon: Users, label: "קהל" },
  { icon: Swords, label: "מתחרים" },
  { icon: Compass, label: "כיוון" },
];

// A zigzag, not a flat arc: alternating y keeps each card's bounding box
// clear of its neighbors even where their x ranges come close, so all
// four stay individually readable instead of tucking behind each other.
const DISCOVERY_LAYOUT = [
  { x: -140, y: 80, rotate: -9 },
  { x: -45, y: -85, rotate: -3 },
  { x: 55, y: 85, rotate: 6 },
  { x: 150, y: -80, rotate: 12 },
];

// Mid-scroll waypoint: the cards briefly scatter further apart before
// converging, reading as an actual shuffle rather than a straight slide.
const DISCOVERY_SHUFFLE = [
  { x: -80, y: -75, rotate: 18 },
  { x: 95, y: 55, rotate: -20 },
  { x: -100, y: 62, rotate: 14 },
  { x: 60, y: -70, rotate: -12 },
];

// End state: converged into one stacked pile, each card offset by a few
// px/deg so the stack still reads as distinct layered cards, not one blob.
const DISCOVERY_STACK = [
  { x: 0, y: 10, rotate: -6 },
  { x: 0, y: 3, rotate: 3 },
  { x: 0, y: -3, rotate: -3 },
  { x: 0, y: -10, rotate: 6 },
];

export function DiscoveryIllustration({ active }: IllustrationProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !stageRef.current || !rootRef.current) return;
    const stage = stageRef.current;
    const root = rootRef.current;
    const cards = Array.from(stage.querySelectorAll<HTMLElement>("[data-card]"));
    const wraps = Array.from(stage.querySelectorAll<HTMLElement>("[data-card-wrap]"));

    const ctx = gsap.context(() => {
      // Hand the wraps' position over to GSAP from the exact spot the inline
      // style already painted them at, so taking control never causes a jump.
      gsap.set(wraps, {
        x: (i: number) => DISCOVERY_LAYOUT[i].x,
        y: (i: number) => DISCOVERY_LAYOUT[i].y,
        rotation: (i: number) => DISCOVERY_LAYOUT[i].rotate,
      });
      gsap.set(cards, { opacity: 0, y: 22, scale: 0.85, rotateY: 0 });
      const timeline = gsap.timeline();

      timeline.to(cards, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.12, ease: "back.out(1.8)" });

      cards.forEach((card, i) => {
        timeline.to(card, { rotateY: 180, duration: 0.65, ease: "power2.inOut" }, i === 0 ? "+=0.25" : "-=0.4");
      });

      // Once every card is revealed, the whole stack keeps swaying gently —
      // a slow, continuous tilt so the 3D depth stays visible at rest
      // instead of only showing up during the flip.
      timeline.to(
        stage,
        { rotateY: "+=5", rotateX: "-=3", duration: 2.6, ease: "sine.inOut", repeat: -1, yoyo: true },
        "-=0.15"
      );

      // Scroll-driven: as the page moves past step 1 toward step 2, the
      // fanned cards shuffle apart once more, then collapse into a single
      // stacked pile — everything learned coming together before the next
      // step (Design) begins.
      const shuffleTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          // Both ends anchored to the illustration's own center so the
          // whole sequence plays out — and settles into the stack — while
          // it's still on screen, instead of resolving after it has
          // already scrolled past the top of the viewport.
          start: "center 60%",
          end: "center 15%",
          scrub: 0.6,
        },
      });

      wraps.forEach((wrap, i) => {
        shuffleTimeline
          .to(
            wrap,
            {
              x: DISCOVERY_SHUFFLE[i].x,
              y: DISCOVERY_SHUFFLE[i].y,
              rotation: DISCOVERY_SHUFFLE[i].rotate,
              duration: 0.4,
              ease: "power1.inOut",
            },
            0
          )
          .to(
            wrap,
            {
              x: DISCOVERY_STACK[i].x,
              y: DISCOVERY_STACK[i].y,
              rotation: DISCOVERY_STACK[i].rotate,
              duration: 0.6,
              ease: "power2.inOut",
            },
            0.45
          );
      });
    }, rootRef);

    return () => ctx.revert();
  }, [active]);

  return (
    <div ref={rootRef} style={{ perspective: 1100 }} className="flex h-[480px] w-[600px] items-center justify-center">
      <div
        ref={stageRef}
        style={{ transformStyle: "preserve-3d", transform: "rotateX(10deg)" }}
        className="relative h-[210px] w-[420px]"
      >
        {DISCOVERY_CARDS.map(({ icon: Icon, label }, i) => {
          const layout = DISCOVERY_LAYOUT[i];
          return (
            <div
              key={label}
              data-card-wrap
              style={{
                transformStyle: "preserve-3d",
                left: "50%",
                top: "50%",
                marginLeft: -78,
                marginTop: -54,
                transform: `translate(${layout.x}px, ${layout.y}px) rotate(${layout.rotate}deg)`,
              }}
              className="absolute h-[108px] w-[156px]"
            >
              <div data-card style={{ transformStyle: "preserve-3d" }} className="relative h-full w-full">
                {/* Front face: a blank card, nothing learned yet */}
                <div
                  style={{ backfaceVisibility: "hidden" }}
                  className="absolute inset-0 rounded-xl border border-accent/25 bg-[radial-gradient(circle_at_30%_20%,rgba(74,74,74,0.08)_0%,transparent_70%)] shadow-[0_14px_28px_rgba(0,0,0,0.1)]"
                >
                  <div className="absolute inset-3 rounded-md border border-dashed border-accent/20" />
                </div>
                {/* Back face: revealed once the card flips */}
                <div
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 rounded-xl border border-accent/30 bg-white shadow-[0_18px_34px_rgba(0,0,0,0.14)]"
                >
                  <Icon size={30} strokeWidth={1.75} className="text-accent" />
                  <span className="font-display text-[15px] font-semibold text-black/70">{label}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
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

        // Once done writing, the pencil exits off-canvas to the right
        // instead of hovering in place — reads as "done, out of the way,"
        // rather than lingering disconnected over the last line.
        timeline.addLabel("linesDone");
        const lastLine = DESIGN_LINES[DESIGN_LINES.length - 1];
        timeline.to(
          pencil,
          { x: 270, y: lastLine.y - 10, opacity: 0, duration: 0.6, ease: "power1.in" },
          "linesDone"
        );
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
      <rect data-draw x="25" y="40" width="170" height="150" rx="14" stroke={STROKE_BRIGHT} strokeWidth="1.5" fill="rgba(74,74,74,0.04)" />
      <rect x="25" y="40" width="170" height="28" rx="14" fill="rgba(74,74,74,0.1)" />
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
          fill={i === 0 ? STROKE_BRIGHT : "rgba(0,0,0,0.13)"}
        />
      ))}
      <rect
        data-cta
        x={DESIGN_CTA.x}
        y={DESIGN_CTA.y}
        width={DESIGN_CTA.width}
        height={DESIGN_CTA.height}
        rx="6"
        fill="rgba(74,74,74,0.55)"
        style={{ filter: "drop-shadow(0 0 8px rgba(74,74,74,0.5))" }}
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
      const timeline = gsap.timeline({ delay: 0.7 });
      lines.forEach((line, i) => {
        const target = line.scrollWidth;
        timeline.to(line, { width: target, duration: 0.5, ease: "steps(12)" }, i === 0 ? undefined : "-=0.1");
      });
      timeline.to("[data-cursor]", { opacity: 0, repeat: -1, yoyo: true, duration: 0.5, ease: "steps(1)" });
    }, containerRef.current);

    return () => ctx.revert();
  }, [active]);

  const codeLines = [
    { text: "const", color: "rgba(74,74,74,0.85)", suffix: " studio = {" },
    { text: "  name:", color: "rgba(0,0,0,0.5)", suffix: ' "YEYE LABS"', suffixColor: "rgba(22,163,74,0.85)" },
    { text: "  quality:", color: "rgba(0,0,0,0.5)", suffix: " 100", suffixColor: "rgba(22,163,74,0.85)" },
    { text: "  deliver:", color: "rgba(0,0,0,0.5)", suffix: " true", suffixColor: "rgba(22,163,74,0.85)" },
    { text: "}", color: "rgba(74,74,74,0.85)", suffix: "" },
  ];

  return (
    <div
      ref={containerRef}
      className="h-[340px] w-[420px] overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_20px_45px_rgba(0,0,0,0.08)]"
      dir="ltr"
    >
      <div className="flex h-12 items-center gap-2 bg-black/[0.03] px-5">
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
        <span data-cursor className="mt-0.5 inline-block h-4 w-2.5 rounded-[1px] bg-accent" />
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
        );
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
        fill="rgba(74,74,74,0.08)"
      />
      <circle data-draw cx="100" cy="88" r="13" stroke={STROKE_BRIGHT} strokeWidth="1.5" fill="rgba(74,74,74,0.2)" />
      <path data-draw d="M72 116 L48 144 L72 139 Z" stroke={STROKE_DIM} strokeWidth="1.5" fill="rgba(74,74,74,0.05)" />
      <path data-draw d="M128 116 L152 144 L128 139 Z" stroke={STROKE_DIM} strokeWidth="1.5" fill="rgba(74,74,74,0.05)" />
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
