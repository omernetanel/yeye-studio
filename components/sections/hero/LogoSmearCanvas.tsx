"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const MAX_IMPULSES = 24;
const SIGMA_PX = 130;
const FORCE_SCALE = 2.2;
const MAX_STEP_DELTA = 40;
const MAX_STRENGTH = 70;
const DECAY = 0.9;
const REST_EPSILON = 0.25;

const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;
  uniform sampler2D map;
  uniform vec2 resolution;
  uniform vec2 impulsePos[${MAX_IMPULSES}];
  uniform vec2 impulseDir[${MAX_IMPULSES}];
  uniform int impulseCount;
  uniform float sigma;
  varying vec2 vUv;

  void main() {
    vec2 pixelPos = vUv * resolution;
    vec2 dispPixels = vec2(0.0);

    for (int i = 0; i < ${MAX_IMPULSES}; i++) {
      if (i >= impulseCount) break;
      vec2 d = pixelPos - impulsePos[i];
      float dist2 = dot(d, d);
      float falloff = exp(-dist2 / (2.0 * sigma * sigma));
      dispPixels += impulseDir[i] * falloff;
    }

    vec2 sampleUv = clamp(vUv - dispPixels / resolution, 0.0, 1.0);
    vec4 tex = texture2D(map, sampleUv);

    float warpMag = length(dispPixels);
    float fade = 1.0 - smoothstep(0.0, 60.0, warpMag) * 0.82;

    gl_FragColor = vec4(0.0, 0.0, 0.0, tex.a * fade);
  }
`;

interface Impulse {
  x: number;
  y: number;
  dx: number;
  dy: number;
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

    let disposed = false;
    let rafId: number | null = null;
    let impulses: Impulse[] = [];

    const pointer: Pointer = { x: -9999, y: -9999, lastX: -9999, lastY: -9999, active: false, initialized: false };

    const impulsePosUniform = Array.from({ length: MAX_IMPULSES }, () => new THREE.Vector2());
    const impulseDirUniform = Array.from({ length: MAX_IMPULSES }, () => new THREE.Vector2());

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        map: { value: null },
        resolution: { value: new THREE.Vector2(1, 1) },
        impulsePos: { value: impulsePosUniform },
        impulseDir: { value: impulseDirUniform },
        impulseCount: { value: 0 },
        sigma: { value: SIGMA_PX },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let ready = false;

    const render = () => {
      renderer.render(scene, camera);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(rect.width, rect.height, false);
      material.uniforms.resolution.value.set(rect.width, rect.height);
      impulses = [];
      if (ready) render();
    };

    const step = () => {
      if (pointer.active) {
        const dx = pointer.x - pointer.lastX;
        const dy = pointer.y - pointer.lastY;
        const speed = Math.hypot(dx, dy);
        if (speed > 0.4) {
          const cdx = Math.max(-MAX_STEP_DELTA, Math.min(MAX_STEP_DELTA, dx)) * FORCE_SCALE;
          const cdy = Math.max(-MAX_STEP_DELTA, Math.min(MAX_STEP_DELTA, dy)) * FORCE_SCALE;
          impulses.push({ x: pointer.x, y: pointer.y, dx: cdx, dy: cdy });
          if (impulses.length > MAX_IMPULSES) impulses.shift();
        }
        pointer.lastX = pointer.x;
        pointer.lastY = pointer.y;
      }

      for (let i = impulses.length - 1; i >= 0; i--) {
        const imp = impulses[i];
        imp.dx *= DECAY;
        imp.dy *= DECAY;
        if (Math.abs(imp.dx) < REST_EPSILON && Math.abs(imp.dy) < REST_EPSILON) {
          impulses.splice(i, 1);
        } else {
          const mag = Math.hypot(imp.dx, imp.dy);
          if (mag > MAX_STRENGTH) {
            const scale = MAX_STRENGTH / mag;
            imp.dx *= scale;
            imp.dy *= scale;
          }
        }
      }

      const count = Math.min(impulses.length, MAX_IMPULSES);
      for (let i = 0; i < count; i++) {
        impulsePosUniform[i].set(impulses[i].x, impulses[i].y);
        impulseDirUniform[i].set(impulses[i].dx, impulses[i].dy);
      }
      material.uniforms.impulseCount.value = count;

      render();

      if (count > 0 || pointer.active) {
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

    const toLocal = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = rect.height - (clientY - rect.top);
      return { x, y };
    };

    const handlePointerMove = (e: PointerEvent) => {
      const { x, y } = toLocal(e.clientX, e.clientY);
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

    const loader = new THREE.TextureLoader();
    loader.load(src, (texture) => {
      if (disposed) return;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      material.uniforms.map.value = texture;
      ready = true;
      resize();
    });

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
      geometry.dispose();
      material.dispose();
      material.uniforms.map.value?.dispose();
      renderer.dispose();
    };
  }, [src]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
