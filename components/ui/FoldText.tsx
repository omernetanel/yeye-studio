"use client";

import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import "./FoldText.css";

/**
 * React Bits' FoldText, ported to TypeScript.
 *
 * Each glyph hangs from a hinge and swings down into place, with a crease
 * shading gradient that fades as it flattens — so the line reads as a sheet
 * being unfolded rather than as letters fading in. That is the reason it is
 * here and not one of the other twenty text effects: this page's largest
 * section is a piece of paper opening, and the heading over the work should
 * be made of the same gesture.
 *
 * ON GSAP, WHICH THIS BRINGS IN: CONTEXT.md records ScrollTrigger being tried
 * and removed, and that stands — for SCRUBBING. Its easing compounded with
 * Lenis's, so a gentle scroll barely registered and a fast one skipped stages,
 * and every pinned section here does its own arithmetic off raw scrollY
 * instead. This is not that: one `once: true` trigger that fires a timeline
 * when the heading comes into view and is then done. Nothing is scrubbed and
 * nothing is pinned, so there is no easing to compound.
 */

const HINGE_CONFIG = {
  top: { origin: "50% 0%", rotateX: -92, rotateY: 0 },
  bottom: { origin: "50% 100%", rotateX: 92, rotateY: 0 },
  left: { origin: "0% 50%", rotateX: 0, rotateY: 92 },
  right: { origin: "100% 50%", rotateX: 0, rotateY: -92 },
} as const;

type Hinge = keyof typeof HINGE_CONFIG;
type SplitBy = "char" | "word" | "line";
type Trigger = "mount" | "scroll" | "hover" | "loop";

type FoldTextProps = {
  text?: string;
  splitBy?: SplitBy;
  hinge?: Hinge;
  duration?: number;
  stagger?: number;
  ease?: string;
  perspective?: number;
  creaseShading?: number;
  trigger?: Trigger;
  fontSize?: number | string;
  fontWeight?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const renderWhitespace = (value: string, key: string): ReactNode[] =>
  value.split(/(\n)/).map((part, index) => {
    if (part === "\n") return <br key={`${key}-br-${index}`} />;
    if (!part) return null;

    return (
      <span className="fold-text-whitespace" key={`${key}-space-${index}`}>
        {part.replace(/ /g, " ")}
      </span>
    );
  });

export default function FoldText({
  text = "Design unfolds",
  splitBy = "char",
  hinge = "top",
  duration = 0.65,
  stagger = 0.045,
  ease = "power3.out",
  perspective = 700,
  creaseShading = 0.55,
  trigger = "mount",
  fontSize = 80,
  fontWeight = 800,
  color = "#f7f2e8",
  className = "",
  style = {},
}: FoldTextProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const hingeConfig = HINGE_CONFIG[hinge] ?? HINGE_CONFIG.top;
  const safeCrease = clamp(creaseShading, 0, 1);
  const safePerspective = Math.max(120, perspective);

  const segments = useMemo(() => {
    let segmentIndex = 0;

    const renderSegment = (content: string, key: string, split: SplitBy = splitBy) => {
      segmentIndex += 1;
      return (
        <span
          className="fold-text-segment"
          data-fold-split={split}
          key={key}
          style={{ "--fold-perspective": `${safePerspective}px` } as CSSProperties}
        >
          <span
            className="fold-text-piece"
            data-fold-hinge={hinge}
            style={{ transformOrigin: hingeConfig.origin, "--fold-crease": 0 } as CSSProperties}
          >
            {content || " "}
          </span>
        </span>
      );
    };

    if (splitBy === "line") {
      return text.split("\n").map((line, index) => (
        <span className="fold-text-line" key={`line-${index}`}>
          {renderSegment(line || " ", `segment-line-${index}`, "line")}
        </span>
      ));
    }

    if (splitBy === "word") {
      return text.split(/(\s+)/).flatMap((part, index) => {
        if (!part) return [];
        if (/^\s+$/.test(part)) return renderWhitespace(part, `ws-${index}`);
        return renderSegment(part, `segment-word-${segmentIndex}`);
      });
    }

    return Array.from(text).map((char, index) => {
      if (char === "\n") return <br key={`br-${index}`} />;
      return renderSegment(char === " " ? " " : char, `segment-char-${index}`);
    });
  }, [text, splitBy, hinge, hingeConfig.origin, safePerspective]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    gsap.registerPlugin(ScrollTrigger);

    const pieces = Array.from(root.querySelectorAll<HTMLElement>(".fold-text-piece"));
    if (!pieces.length) return;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const activeDuration = reduceMotion ? Math.min(duration, 0.22) : duration;
    const activeStagger = reduceMotion ? Math.min(stagger, 0.02) : stagger;
    const fromVars = {
      opacity: 0,
      rotateX: reduceMotion ? 0 : hingeConfig.rotateX,
      rotateY: reduceMotion ? 0 : hingeConfig.rotateY,
      "--fold-crease": reduceMotion ? 0 : safeCrease,
      transformOrigin: hingeConfig.origin,
      force3D: true,
    };
    const toVars = {
      opacity: 1,
      rotateX: 0,
      rotateY: 0,
      "--fold-crease": 0,
      duration: activeDuration,
      ease: reduceMotion ? "power1.out" : ease,
      stagger: activeStagger,
      clearProps: "willChange",
    };

    const killTimeline = () => {
      timelineRef.current?.kill();
      timelineRef.current = null;
      gsap.killTweensOf(pieces);
    };

    const play = (repeat: boolean) => {
      killTimeline();
      timelineRef.current = gsap.timeline({
        repeat: repeat ? -1 : 0,
        repeatDelay: repeat ? 0.75 : 0,
      });
      timelineRef.current.fromTo(pieces, fromVars, toVars);
      return timelineRef.current;
    };

    let scrollTrigger: ScrollTrigger | undefined;
    let hoverHandler: (() => void) | undefined;

    if (trigger === "hover") {
      gsap.set(pieces, {
        opacity: 1,
        rotateX: 0,
        rotateY: 0,
        "--fold-crease": 0,
        transformOrigin: hingeConfig.origin,
      });
      hoverHandler = () => play(false);
      root.addEventListener("mouseenter", hoverHandler);
    } else if (trigger === "scroll") {
      gsap.set(pieces, fromVars);
      scrollTrigger = ScrollTrigger.create({
        trigger: root,
        start: "top 82%",
        once: true,
        onEnter: () => play(false),
      });
    } else if (trigger === "loop") {
      play(true);
    } else {
      play(false);
    }

    return () => {
      if (hoverHandler) root.removeEventListener("mouseenter", hoverHandler);
      scrollTrigger?.kill();
      killTimeline();
    };
  }, [
    text,
    splitBy,
    hinge,
    duration,
    stagger,
    ease,
    perspective,
    safeCrease,
    trigger,
    hingeConfig.origin,
    hingeConfig.rotateX,
    hingeConfig.rotateY,
  ]);

  const rootStyle = {
    "--fold-text-font-size": typeof fontSize === "number" ? `${fontSize}px` : fontSize,
    "--fold-text-font-weight": fontWeight,
    "--fold-text-color": color,
    ...style,
  } as CSSProperties;

  return (
    <span ref={rootRef} className={`fold-text ${className}`.trim()} style={rootStyle}>
      <span className="fold-text-sr-only">{text}</span>
      <span className="fold-text-visual" aria-hidden="true">
        {segments}
      </span>
    </span>
  );
}
