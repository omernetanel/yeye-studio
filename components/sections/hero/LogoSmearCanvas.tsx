"use client";

import { useEffect, useRef } from "react";

const CELL_SIZE = 16;
const MIN_COLS = 24;
const MAX_COLS = 90;
const FORCE_RADIUS = 120;
const FORCE_SCALE = 1.4;
const SPRING_K = 0.014;
const DAMPING = 0.93;
const MAX_OFFSET = 64;
const REST_EPSILON = 0.05;

interface GridPoint {
  baseX: number;
  baseY: number;
  offsetX: number;
  offsetY: number;
  vx: number;
  vy: number;
}

interface Pointer {
  x: number;
  y: number;
  lastX: number;
  lastY: number;
  active: boolean;
  initialized: boolean;
}

export default function LogoSmearCanvas({ src, className }: { src: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let disposed = false;
    let rafId: number | null = null;
    let dpr = 1;
    let cellW = 0;
    let cellH = 0;
    let points: GridPoint[] = [];
    let buffer: HTMLCanvasElement | null = null;

    const pointer: Pointer = { x: -9999, y: -9999, lastX: -9999, lastY: -9999, active: false, initialized: false };

    const img = new Image();
    img.src = src;

    const buildGrid = (width: number, height: number) => {
      const cols = Math.min(MAX_COLS, Math.max(MIN_COLS, Math.round(width / CELL_SIZE)));
      cellW = width / cols;
      const rows = Math.max(1, Math.round(height / cellW));
      cellH = height / rows;
      const next: GridPoint[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          next.push({ baseX: c * cellW, baseY: r * cellH, offsetX: 0, offsetY: 0, vx: 0, vy: 0 });
        }
      }
      points = next;
    };

    const renderOffscreen = (width: number, height: number) => {
      if (!img.complete || img.naturalWidth === 0) return;
      const b = document.createElement("canvas");
      b.width = Math.round(width * dpr);
      b.height = Math.round(height * dpr);
      const bctx = b.getContext("2d");
      if (!bctx) return;
      bctx.filter = "brightness(0)";
      bctx.drawImage(img, 0, 0, b.width, b.height);
      buffer = b;
    };

    const draw = () => {
      if (!buffer) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const pad = 1.5;
      for (const p of points) {
        const sx = p.baseX * dpr;
        const sy = p.baseY * dpr;
        const sw = cellW * dpr;
        const sh = cellH * dpr;
        const dx = (p.baseX + p.offsetX - pad) * dpr;
        const dy = (p.baseY + p.offsetY - pad) * dpr;
        const dw = (cellW + pad * 2) * dpr;
        const dh = (cellH + pad * 2) * dpr;
        ctx.drawImage(buffer, sx, sy, sw, sh, dx, dy, dw, dh);
      }
    };

    const step = () => {
      const dxPointer = pointer.x - pointer.lastX;
      const dyPointer = pointer.y - pointer.lastY;
      let anyActive = false;

      for (const p of points) {
        if (pointer.active) {
          const cx = p.baseX + p.offsetX;
          const cy = p.baseY + p.offsetY;
          const dist = Math.hypot(cx - pointer.x, cy - pointer.y);
          if (dist < FORCE_RADIUS) {
            const influence = (1 - dist / FORCE_RADIUS) ** 2;
            p.vx += dxPointer * influence * FORCE_SCALE;
            p.vy += dyPointer * influence * FORCE_SCALE;
          }
        }
        p.vx += -p.offsetX * SPRING_K;
        p.vy += -p.offsetY * SPRING_K;
        p.vx *= DAMPING;
        p.vy *= DAMPING;
        p.offsetX += p.vx;
        p.offsetY += p.vy;

        const mag = Math.hypot(p.offsetX, p.offsetY);
        if (mag > MAX_OFFSET) {
          const scale = MAX_OFFSET / mag;
          p.offsetX *= scale;
          p.offsetY *= scale;
        }

        if (
          Math.abs(p.vx) > REST_EPSILON ||
          Math.abs(p.vy) > REST_EPSILON ||
          Math.abs(p.offsetX) > REST_EPSILON ||
          Math.abs(p.offsetY) > REST_EPSILON
        ) {
          anyActive = true;
        }
      }

      pointer.lastX = pointer.x;
      pointer.lastY = pointer.y;

      draw();

      if (anyActive || pointer.active) {
        rafId = requestAnimationFrame(step);
      } else {
        rafId = null;
      }
    };

    const ensureLoop = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(step);
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      buildGrid(rect.width, rect.height);
      renderOffscreen(rect.width, rect.height);
      draw();
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (!pointer.initialized) {
        pointer.lastX = x;
        pointer.lastY = y;
        pointer.initialized = true;
      }
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
      ensureLoop();
    };

    const handlePointerLeave = () => {
      pointer.active = false;
      ensureLoop();
    };

    img.onload = () => {
      if (disposed) return;
      resize();
    };
    if (img.complete && img.naturalWidth > 0) resize();

    const ro = new ResizeObserver(() => resize());
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
  }, [src]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
