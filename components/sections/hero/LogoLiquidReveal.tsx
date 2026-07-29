"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
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

// How fast the blob "commits ink" to the trail once the pointer is active,
// and how fast it stops once it isn't — independent of how slowly that
// ink then fades, which is TRAIL_DECAY_HALF_LIFE below.
const PAINT_ATTACK_RATE = 10;

// The actual "flowing liquid" feel: once painted, a point in the trail
// keeps glowing and decays on its own, so a moving pointer leaves behind a
// slowly-dissolving streak instead of a single dot that just teleports.
const TRAIL_DECAY_HALF_LIFE = 1.1; // seconds

// The trail buffer is deliberately lower-resolution than the display
// canvas — both for performance (it's a ping-ponged full-screen pass every
// frame) and because the bilinear upsampling softens it into something
// that reads as liquid rather than a sharp procedural mask.
const TRAIL_MAX_WIDTH = 720;

// The logo is ~3.2:1 (very wide); the source video is 16:9. Tiling the
// video horizontally instead of stretching it into the logo's aspect
// keeps its own proportions intact.
const VIDEO_REPEAT_X = 2;

const TRAIL_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const TRAIL_FRAGMENT_SHADER = `
  precision highp float;
  uniform sampler2D prevTrail;
  uniform vec2 resolution;
  uniform vec2 blobPos[${BLOB_COUNT}];
  uniform float blobRadius[${BLOB_COUNT}];
  uniform float time;
  uniform float paintStrength;
  uniform float decayFactor;
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

    float blobMask = smoothstep(0.85, 1.25, field) * paintStrength;
    float prev = texture2D(prevTrail, vUv).r;
    float next = max(prev * decayFactor, blobMask);

    gl_FragColor = vec4(next, next, next, 1.0);
  }
`;

const COMPOSE_VERTEX_SHADER = TRAIL_VERTEX_SHADER;

const COMPOSE_FRAGMENT_SHADER = `
  precision highp float;
  uniform sampler2D logoTex;
  uniform sampler2D videoTex;
  uniform sampler2D trailTex;
  uniform float scrollReveal;
  uniform float videoRepeatX;
  varying vec2 vUv;

  void main() {
    float logoAlpha = texture2D(logoTex, vUv).a;
    float trailVal = texture2D(trailTex, vUv).r;
    float reveal = logoAlpha * clamp(max(trailVal, scrollReveal), 0.0, 1.0);

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

export interface LogoLiquidRevealHandle {
  /** Uniformly light up the whole logo regardless of pointer position — driven by scroll, not hover. 0..1. */
  setScrollReveal: (value: number) => void;
}

interface LogoLiquidRevealProps {
  logoSrc: string;
  videoSrc: string;
  className?: string;
}

const LogoLiquidReveal = forwardRef<LogoLiquidRevealHandle, LogoLiquidRevealProps>(function LogoLiquidReveal(
  { logoSrc, videoSrc, className },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRevealRef = useRef(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  useImperativeHandle(ref, () => ({
    setScrollReveal: (value: number) => {
      scrollRevealRef.current = value;
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion) return;

    let disposed = false;
    let rafId: number | null = null;
    let started = false;
    let paintStrength = 0;

    const pointer: Pointer = { x: -9999, y: -9999, active: false, everActive: false };
    const blobs: Blob[] = Array.from({ length: BLOB_COUNT }, () => ({ x: -9999, y: -9999, vx: 0, vy: 0 }));

    const blobPosUniform = Array.from({ length: BLOB_COUNT }, () => new THREE.Vector2());
    const blobRadiusUniform = new Float32Array(BLOB_COUNT);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
    renderer.setClearColor(0x000000, 0);
    renderer.autoClear = false;

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

    // Ping-ponged trail buffer: each frame renders "decay(prev) blended
    // with fresh blob ink" into one target, then that becomes next frame's
    // "prev". This is what turns the blob from a dot that follows the
    // pointer into a streak that lingers and dissolves behind it.
    const trailCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const trailScene = new THREE.Scene();
    const trailGeometry = new THREE.PlaneGeometry(2, 2);
    const trailMaterial = new THREE.ShaderMaterial({
      uniforms: {
        prevTrail: { value: null },
        resolution: { value: new THREE.Vector2(1, 1) },
        blobPos: { value: blobPosUniform },
        blobRadius: { value: blobRadiusUniform },
        time: { value: 0 },
        paintStrength: { value: 0 },
        decayFactor: { value: 1 },
      },
      vertexShader: TRAIL_VERTEX_SHADER,
      fragmentShader: TRAIL_FRAGMENT_SHADER,
    });
    trailScene.add(new THREE.Mesh(trailGeometry, trailMaterial));

    const rtOptions = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: false,
      stencilBuffer: false,
    };
    const trailA = new THREE.WebGLRenderTarget(1, 1, rtOptions);
    const trailB = new THREE.WebGLRenderTarget(1, 1, rtOptions);
    let trailRead = trailA;
    let trailWrite = trailB;

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
        trailTex: { value: null },
        scrollReveal: { value: 0 },
        videoRepeatX: { value: VIDEO_REPEAT_X },
      },
      vertexShader: COMPOSE_VERTEX_SHADER,
      fragmentShader: COMPOSE_FRAGMENT_SHADER,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let ready = false;

    const clearTrails = () => {
      renderer.setRenderTarget(trailA);
      renderer.clear();
      renderer.setRenderTarget(trailB);
      renderer.clear();
      renderer.setRenderTarget(null);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(rect.width, rect.height, false);
      trailMaterial.uniforms.resolution.value.set(rect.width, rect.height);

      const trailWidth = Math.round(Math.min(TRAIL_MAX_WIDTH, rect.width));
      const trailHeight = Math.round(trailWidth * (rect.height / rect.width));
      trailA.setSize(trailWidth, trailHeight);
      trailB.setSize(trailWidth, trailHeight);
      clearTrails();

      if (ready) {
        renderer.setRenderTarget(null);
        renderer.render(scene, camera);
      }
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

      const targetPaint = pointer.active ? 1 : 0;
      paintStrength += (targetPaint - paintStrength) * (1 - Math.exp(-PAINT_ATTACK_RATE * dt));

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

      // Pass 1: paint this frame's blob ink onto the decayed previous trail.
      trailMaterial.uniforms.prevTrail.value = trailRead.texture;
      trailMaterial.uniforms.time.value = t;
      trailMaterial.uniforms.paintStrength.value = paintStrength;
      trailMaterial.uniforms.decayFactor.value = Math.pow(0.5, dt / TRAIL_DECAY_HALF_LIFE);
      renderer.setRenderTarget(trailWrite);
      renderer.render(trailScene, trailCamera);
      const swap = trailRead;
      trailRead = trailWrite;
      trailWrite = swap;

      // Pass 2: composite logo + video through the trail (plus the
      // scroll-driven full-logo reveal) onto the visible canvas.
      material.uniforms.trailTex.value = trailRead.texture;
      material.uniforms.scrollReveal.value = scrollRevealRef.current;
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);

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

    // The scroll-driven reveal has no pointer involvement at all, so the
    // render loop needs to be running independently of hover — otherwise
    // scrolling past the Hero before ever touching it would show nothing.
    startLoop();
    started = true;

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
      trailGeometry.dispose();
      trailMaterial.dispose();
      trailA.dispose();
      trailB.dispose();
      renderer.dispose();
    };
  }, [logoSrc, videoSrc, prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return <canvas ref={canvasRef} aria-hidden="true" className={className} style={{ touchAction: "pan-y" }} />;
});

export default LogoLiquidReveal;
