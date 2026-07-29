"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";

// One large main blob (index 0, follows the pointer) plus four satellites
// at varied sizes and orbit distances — big ones close enough to bridge
// into the main mass with thin metaball tendrils, small ones far enough to
// read as separate ink droplets. That size/distance variety is what makes
// the field look like a big irregular ink splat instead of a few clean
// circles (see FIELD_LOW/FIELD_HIGH below for the sharp-edge part of that).
const BLOB_COUNT = 5;
const BASE_RADIUS = [127, 83, 61, 30, 23];
const ORBIT_RADIUS = [0, 77, 102, 149, 182];
const ORBIT_SPEED = [0, 0.4, 0.3, 0.55, 0.46];
const ORBIT_PHASE = [0, 0.6, 2.5, 4.1, 1.3];
const BREATHE_AMOUNT = [18, 14, 12, 7, 6];
const BREATHE_SPEED = [0.5, 0.65, 0.4, 0.8, 0.6];

const FOLLOW_SPRING_K = 0.045;
const FOLLOW_DAMPING = 0.86;

// How fast the blob "commits ink" to the trail once the pointer is active,
// and how fast it stops once it isn't — independent of how slowly that
// ink then fades, which is TRAIL_DECAY_HALF_LIFE below. Both fast: the
// splat should feel like it's snapping on under the cursor immediately,
// not fading up gradually.
const PAINT_ATTACK_RATE = 28;

// A moving pointer still leaves a brief dissolving streak (the "flowing
// liquid" feel), but short — this was 1.1s and read as sluggish; a splat
// that lingers for over a second after the pointer leaves reads as
// unresponsive rather than liquid.
const TRAIL_DECAY_HALF_LIFE = 0.4; // seconds

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

    // Strong domain warp so the blobs' edges tear into the thin, irregular
    // tendrils and pinched waists of a real ink splat instead of tracing
    // clean circular arcs.
    vec2 warp = vec2(
      valueNoise(pixelPos * 0.01 + vec2(time * 0.06, 0.0)),
      valueNoise(pixelPos * 0.01 + vec2(0.0, time * 0.06) + 50.0)
    );
    vec2 warpedPos = pixelPos + (warp - 0.5) * 160.0;

    float field = 0.0;
    for (int i = 0; i < ${BLOB_COUNT}; i++) {
      vec2 d = warpedPos - blobPos[i];
      float d2 = dot(d, d);
      field += (blobRadius[i] * blobRadius[i]) / max(d2, 1.0);
    }

    // A narrow threshold band reads as a crisp ink edge rather than a
    // soft glow — splat paint has a hard boundary, not a gradient falloff.
    float blobMask = smoothstep(0.92, 1.06, field) * paintStrength;
    float prev = texture2D(prevTrail, vUv).r;
    float next = max(prev * decayFactor, blobMask);

    gl_FragColor = vec4(next, next, next, 1.0);
  }
`;

const COMPOSE_VERTEX_SHADER = TRAIL_VERTEX_SHADER;

// Scroll-driven reveal seeds: several points scattered across the
// wordmark (roughly two per glyph), each growing its own patch of light
// on a slightly staggered schedule — reads as several places lighting up
// independently rather than one flat waterline sweeping across the whole
// logo at once. Positions are hand-placed in UV space (0,0 = bottom-left).
const SCROLL_SEED_COUNT = 8;
const SCROLL_SEED_POS = [
  [0.11, 0.28], [0.16, 0.74],
  [0.37, 0.7], [0.41, 0.26],
  [0.61, 0.27], [0.57, 0.73],
  [0.88, 0.72], [0.83, 0.29],
];
const SCROLL_SEED_DELAY = [0, 0.14, 0.05, 0.22, 0.02, 0.16, 0.09, 0.25];
const SCROLL_SEED_RADIUS = 0.55;

const COMPOSE_FRAGMENT_SHADER = `
  precision highp float;
  uniform sampler2D logoTex;
  uniform sampler2D videoTex;
  uniform sampler2D trailTex;
  uniform float scrollReveal;
  uniform float videoRepeatX;
  uniform float time;
  uniform vec2 resolution;
  uniform vec2 scrollSeedPos[${SCROLL_SEED_COUNT}];
  uniform float scrollSeedDelay[${SCROLL_SEED_COUNT}];
  varying vec2 vUv;

  float hash1(float n) {
    return fract(sin(n) * 43758.5453123);
  }

  float waveNoise(float x) {
    float i = floor(x);
    float f = fract(x);
    float a = hash1(i);
    float b = hash1(i + 1.0);
    return mix(a, b, f * f * (3.0 - 2.0 * f));
  }

  void main() {
    float logoAlpha = texture2D(logoTex, vUv).a;
    float trailVal = texture2D(trailTex, vUv).r;

    // Aspect-correct so growth reads circular rather than squished on
    // this very wide canvas.
    float aspect = resolution.x / max(resolution.y, 1.0);

    float scrollField = 0.0;
    for (int i = 0; i < ${SCROLL_SEED_COUNT}; i++) {
      float local = clamp((scrollReveal - scrollSeedDelay[i]) / (1.0 - scrollSeedDelay[i]), 0.0, 1.0);
      float radius = local * ${SCROLL_SEED_RADIUS.toFixed(3)};
      vec2 d = vUv - scrollSeedPos[i];
      d.x *= aspect;
      float wobble = (waveNoise(d.x * 6.0 + d.y * 6.0 + time * 0.2 + float(i) * 11.0) - 0.5) * 0.05;
      float dist = length(d) + wobble;
      float circle = 1.0 - smoothstep(radius - 0.05, radius + 0.05, dist);
      scrollField = max(scrollField, circle);
    }

    // The scroll-driven fill still only lights up the logo itself (kept
    // masked by logoAlpha, unchanged) — but the hover trail is no longer
    // confined to the letter shapes at all: it paints its own opacity
    // (outAlpha below) as well as its own reveal, so the blob can spill
    // into the whitespace around and between the glyphs instead of being
    // clipped the instant it crosses a letter's edge.
    float reveal = clamp(max(trailVal, scrollField * logoAlpha), 0.0, 1.0);
    float outAlpha = max(logoAlpha, trailVal);

    vec2 videoUv = vec2(vUv.x * videoRepeatX, vUv.y);
    vec3 videoColor = texture2D(videoTex, videoUv).rgb;
    vec3 finalColor = mix(vec3(0.0), videoColor, reveal);

    gl_FragColor = vec4(finalColor, outAlpha);
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
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(1, 1) },
        scrollSeedPos: { value: SCROLL_SEED_POS.map(([x, y]) => new THREE.Vector2(x, y)) },
        scrollSeedDelay: { value: new Float32Array(SCROLL_SEED_DELAY) },
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
      material.uniforms.resolution.value.set(rect.width, rect.height);

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
      material.uniforms.time.value = t;
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
