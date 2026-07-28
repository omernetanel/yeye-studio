"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";

// Downscaled working resolution for pixel sampling — the source PNG is
// 8042x2511, far more detail than a sparse dot pattern needs. Sampling a
// smaller copy keeps getImageData() fast without changing which pixels
// read as "inside the logo".
const SAMPLE_WIDTH = 1400;
const ALPHA_THRESHOLD = 100;
// Distance (in sample-space px) between candidate sample points. Larger
// values = fewer, airier dots.
const GRID_SPACING = 5;
// Random offset applied within each grid cell so the result reads as
// scattered dots, not a visible grid.
const JITTER = GRID_SPACING * 0.4;

const IDLE_AMPLITUDE = 1.6;
const IDLE_SPEED = 0.6;
const REPEL_RADIUS = 70;
const REPEL_STRENGTH = 900;
const SPRING_K = 0.06;
const DAMPING = 0.82;

interface Particle {
  // Normalized (0..1) home position within the logo's bounding box.
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  phaseX: number;
  phaseY: number;
}

interface Pointer {
  x: number;
  y: number;
  active: boolean;
}

export default function LogoParticleCanvas({ src, className }: { src: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let rafId: number | null = null;
    let particles: Particle[] = [];
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pointer: Pointer = { x: -9999, y: -9999, active: false };

    const sampleParticles = (img: HTMLImageElement) => {
      const sampleHeight = Math.round(SAMPLE_WIDTH * (img.naturalHeight / img.naturalWidth));
      const off = document.createElement("canvas");
      off.width = SAMPLE_WIDTH;
      off.height = sampleHeight;
      const octx = off.getContext("2d");
      if (!octx) return [];

      octx.drawImage(img, 0, 0, SAMPLE_WIDTH, sampleHeight);
      const { data } = octx.getImageData(0, 0, SAMPLE_WIDTH, sampleHeight);

      const result: Particle[] = [];
      for (let py = GRID_SPACING / 2; py < sampleHeight; py += GRID_SPACING) {
        for (let px = GRID_SPACING / 2; px < SAMPLE_WIDTH; px += GRID_SPACING) {
          const ix = Math.min(SAMPLE_WIDTH - 1, Math.round(px));
          const iy = Math.min(sampleHeight - 1, Math.round(py));
          const alpha = data[(iy * SAMPLE_WIDTH + ix) * 4 + 3];
          if (alpha < ALPHA_THRESHOLD) continue;

          const jx = px + (Math.random() - 0.5) * JITTER;
          const jy = py + (Math.random() - 0.5) * JITTER;
          const homeX = jx / SAMPLE_WIDTH;
          const homeY = jy / sampleHeight;
          result.push({
            homeX,
            homeY,
            x: homeX,
            y: homeY,
            vx: 0,
            vy: 0,
            phaseX: Math.random() * Math.PI * 2,
            phaseY: Math.random() * Math.PI * 2,
          });
        }
      }
      return result;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };

    const toLocal = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      return { x: (clientX - rect.left) / rect.width, y: (clientY - rect.top) / rect.height };
    };

    const drawStatic = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.fillStyle = "rgba(0,0,0,0.88)";
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.homeX * rect.width, p.homeY * rect.height, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const step = (time: number) => {
      const rect = canvas.getBoundingClientRect();
      const t = time * 0.001 * IDLE_SPEED;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.fillStyle = "rgba(0,0,0,0.88)";

      const idleAmpX = IDLE_AMPLITUDE / rect.width;
      const idleAmpY = IDLE_AMPLITUDE / rect.height;

      for (const p of particles) {
        const targetX = p.homeX + Math.sin(t + p.phaseX) * idleAmpX;
        const targetY = p.homeY + Math.cos(t + p.phaseY) * idleAmpY;

        p.vx += (targetX - p.x) * SPRING_K;
        p.vy += (targetY - p.y) * SPRING_K;

        if (pointer.active) {
          const dxPx = (p.x - pointer.x) * rect.width;
          const dyPx = (p.y - pointer.y) * rect.height;
          const distPx = Math.hypot(dxPx, dyPx);
          if (distPx < REPEL_RADIUS && distPx > 0.001) {
            const falloff = 1 - distPx / REPEL_RADIUS;
            const forcePx = falloff * falloff * REPEL_STRENGTH;
            p.vx += (dxPx / distPx) * (forcePx / rect.width) * 0.016;
            p.vy += (dyPx / distPx) * (forcePx / rect.height) * 0.016;
          }
        }

        p.vx *= DAMPING;
        p.vy *= DAMPING;
        p.x += p.vx;
        p.y += p.vy;

        ctx.beginPath();
        ctx.arc(p.x * rect.width, p.y * rect.height, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(step);
    };

    const handlePointerMove = (e: PointerEvent) => {
      const { x, y } = toLocal(e.clientX, e.clientY);
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
    };

    const handlePointerLeave = () => {
      pointer.active = false;
    };

    const img = new Image();
    img.onload = () => {
      if (disposed) return;
      particles = sampleParticles(img);
      resize();
      if (prefersReducedMotion) {
        drawStatic();
      } else {
        rafId = requestAnimationFrame(step);
      }
    };
    img.src = src;

    const ro = new ResizeObserver(() => {
      resize();
      if (prefersReducedMotion) drawStatic();
    });
    ro.observe(canvas);

    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerleave", handlePointerLeave);
    canvas.addEventListener("pointercancel", handlePointerLeave);

    return () => {
      disposed = true;
      ro.disconnect();
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
      canvas.removeEventListener("pointercancel", handlePointerLeave);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [src, prefersReducedMotion]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
