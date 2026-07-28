"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";

// Main blob (index 0, follows the pointer) + two satellites that orbit it
// independently — this is what gives the "several connected regions"
// look instead of one perfect circle.
const BLOB_COUNT = 3;
const BASE_RADIUS = [190, 95, 80];
const ORBIT_RADIUS = [0, 90, 120];
const ORBIT_SPEED = [0, 0.35, 0.27];
const ORBIT_PHASE = [0, 0, Math.PI];
const BREATHE_AMOUNT = [26, 20, 18];
const BREATHE_SPEED = [0.5, 0.7, 0.42];

const FOLLOW_SPRING_K = 0.045;
const FOLLOW_DAMPING = 0.86;
const FADE_IN_SPEED = 2.2; // strength units per second
const FADE_OUT_SPEED = 0.55;

// The logo is ~3.2:1 (very wide); the source video is 16:9. Tiling the
// video horizontally instead of stretching it into the logo's aspect
// keeps its own proportions intact.
const VIDEO_REPEAT_X = 2;

const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;
  uniform sampler2D logoTex;
  uniform sampler2D videoTex;
  uniform vec2 resolution;
  uniform vec2 blobPos[${BLOB_COUNT}];
  uniform float blobRadius[${BLOB_COUNT}];
  uniform float time;
  uniform float globalStrength;
  uniform float videoRepeatX;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec2 pixelPos = vUv * resolution;
    float logoAlpha = texture2D(logoTex, vUv).a;

    // Slow domain warp so the blob's edges wobble organically instead of
    // tracing perfect circular arcs.
    vec2 warp = vec2(
      valueNoise(pixelPos * 0.01 + vec2(time * 0.06, 0.0)),
      valueNoise(pixelPos * 0.01 + vec2(0.0, time * 0.06) + 50.0)
    );
    vec2 warpedPos = pixelPos + (warp - 0.5) * 70.0;

    float field = 0.0;
    for (int i = 0; i < ${BLOB_COUNT}; i++) {
      vec2 d = warpedPos - blobPos[i];
      float d2 = dot(d, d);
      field += (blobRadius[i] * blobRadius[i]) / max(d2, 1.0);
    }

    float blobMask = smoothstep(0.85, 1.25, field) * globalStrength;
    float reveal = logoAlpha * clamp(blobMask, 0.0, 1.0);

    vec2 videoUv = vec2(vUv.x * videoRepeatX, vUv.y);
    vec3 videoColor = texture2D(videoTex, videoUv).rgb;
    vec3 finalColor = mix(vec3(0.0), videoColor, reveal);

    gl_FragColor = vec4(finalColor, logoAlpha);
  }
`;

interface Blob {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Pointer {
  x: number;
  y: number;
  active: boolean;
  everActive: boolean;
}

export default function LogoLiquidReveal({ logoSrc, videoSrc, className }: { logoSrc: string; videoSrc: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion) return;

    let disposed = false;
    let rafId: number | null = null;
    let started = false;
    let strength = 0;

    const pointer: Pointer = { x: -9999, y: -9999, active: false, everActive: false };
    const blobs: Blob[] = Array.from({ length: BLOB_COUNT }, () => ({ x: -9999, y: -9999, vx: 0, vy: 0 }));

    const blobPosUniform = Array.from({ length: BLOB_COUNT }, () => new THREE.Vector2());
    const blobRadiusUniform = new Float32Array(BLOB_COUNT);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
    renderer.setClearColor(0x000000, 0);

    // Must be attached to the DOM (even if invisible) — a detached
    // <video> never reliably decodes frames, which left the texture
    // permanently black no matter what the shader did with it.
    const video = document.createElement("video");
    video.src = videoSrc;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.setAttribute("aria-hidden", "true");
    Object.assign(video.style, {
      position: "fixed",
      width: "1px",
      height: "1px",
      opacity: "0",
      pointerEvents: "none",
      left: "-9999px",
    });
    document.body.appendChild(video);
    video.play().catch(() => {});
    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.wrapS = THREE.RepeatWrapping;
    videoTexture.wrapT = THREE.ClampToEdgeWrapping;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        logoTex: { value: null },
        videoTex: { value: videoTexture },
        resolution: { value: new THREE.Vector2(1, 1) },
        blobPos: { value: blobPosUniform },
        blobRadius: { value: blobRadiusUniform },
        time: { value: 0 },
        globalStrength: { value: 0 },
        videoRepeatX: { value: VIDEO_REPEAT_X },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let ready = false;

    const render = () => renderer.render(scene, camera);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(rect.width, rect.height, false);
      material.uniforms.resolution.value.set(rect.width, rect.height);
      if (ready) render();
    };

    const toLocal = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      return { x: clientX - rect.left, y: rect.height - (clientY - rect.top) };
    };

    const startLoop = () => {
      if (rafId === null) rafId = requestAnimationFrame(step);
    };

    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const t = now * 0.001;

      strength += (pointer.active ? FADE_IN_SPEED : -FADE_OUT_SPEED) * dt;
      strength = Math.max(0, Math.min(1, strength));

      const main = blobs[0];
      const targetX = pointer.everActive ? pointer.x : main.x;
      const targetY = pointer.everActive ? pointer.y : main.y;
      main.vx += (targetX - main.x) * FOLLOW_SPRING_K;
      main.vy += (targetY - main.y) * FOLLOW_SPRING_K;
      main.vx *= FOLLOW_DAMPING;
      main.vy *= FOLLOW_DAMPING;
      main.x += main.vx;
      main.y += main.vy;

      for (let i = 0; i < BLOB_COUNT; i++) {
        const orbitAngle = t * ORBIT_SPEED[i] + ORBIT_PHASE[i];
        const ox = i === 0 ? 0 : Math.cos(orbitAngle) * ORBIT_RADIUS[i];
        const oy = i === 0 ? 0 : Math.sin(orbitAngle * 1.15) * ORBIT_RADIUS[i];
        blobPosUniform[i].set(main.x + ox, main.y + oy);
        blobRadiusUniform[i] = BASE_RADIUS[i] + Math.sin(t * BREATHE_SPEED[i] + i * 2.1) * BREATHE_AMOUNT[i];
      }

      material.uniforms.time.value = t;
      material.uniforms.globalStrength.value = strength;

      render();
      rafId = requestAnimationFrame(step);
    };

    const handlePointerMove = (e: PointerEvent) => {
      const { x, y } = toLocal(e.clientX, e.clientY);
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
      if (!pointer.everActive) {
        pointer.everActive = true;
        blobs[0].x = x;
        blobs[0].y = y;
      }
      if (!started) {
        started = true;
        startLoop();
      }
    };

    const handlePointerLeave = () => {
      pointer.active = false;
    };

    const loader = new THREE.TextureLoader();
    loader.load(logoSrc, (texture) => {
      if (disposed) return;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      material.uniforms.logoTex.value = texture;
      ready = true;
      resize();
      video.play().catch(() => {});
    });

    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);

    // No touch-action: none here on purpose — a drag on the logo should
    // still let the page scroll normally. We only ever read pointer
    // position, never call preventDefault.
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
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.remove();
      geometry.dispose();
      material.dispose();
      material.uniforms.logoTex.value?.dispose();
      videoTexture.dispose();
      renderer.dispose();
    };
  }, [logoSrc, videoSrc, prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return <canvas ref={canvasRef} aria-hidden="true" className={className} style={{ touchAction: "pan-y" }} />;
}
