"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";

// The hero video is itself footage of a "YEYE" wordmark (dripping-paint
// balloon letters), built to the same proportions/margins as logo.png
// (both ~2.44:1 — 3518x1440 and 8042x3300 respectively), so one texture
// UV works for both — no repeat/tiling and no per-asset bounding-box
// remap between the two.
//
// Both source images carry generous internal padding around the actual
// glyphs though (measured via ffmpeg cropdetect on each one's own alpha:
// logo.png's letters occupy only y:646-2707 of its full 3300px height —
// margins of ~20%/18% top/bottom, versus ~10%/8% on the previous, shorter
// logo.png). Sampled at raw 0..1 UV, that reads as a big empty gap above
// the visible wordmark. ASSET_UV_MARGIN crops that down the same way
// `object-fit: cover` does for the plain <img> logo sitting under this
// canvas (see the `object-cover` on that element) — a canvas's own
// content doesn't participate in CSS object-fit at all, so the shader
// has to reproduce that crop itself to keep the two in sync.
const ASSET_UV_MARGIN = 0.152;

// The reveal is a one-shot trigger (see `trigger()` below), not a
// continuous hover/scroll-driven blend — an earlier version drove it from
// a mouse-tracked "ink trail" render pass, but that pass's own soft,
// blurred decay meant partially-revealed pixels showed a dim fraction of
// the video's (often dark) color at partial alpha, which composited
// against the page's white background as a visible gray "dirty" shadow
// around the mark. A fixed-duration wipe has no such soft trailing decay
// to produce that artifact — its own edge band (WIPE_EDGE_SOFTNESS) is a
// deliberately thin antialiasing seam, not a lingering gradient.
const REVEAL_DURATION = 0.35; // seconds, wall-clock, once triggered

const COMPOSE_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// A plain top-to-bottom wipe — WIPE_EDGE_SOFTNESS is how wide the
// transition band is (in UV units), WIPE_WOBBLE_* give it a slightly
// irregular, hand-drawn edge instead of a perfectly straight line.
const WIPE_EDGE_SOFTNESS = 0.035;
const WIPE_WOBBLE_AMOUNT = 0.025;
const WIPE_WOBBLE_FREQ = 4.0;

const COMPOSE_FRAGMENT_SHADER = `
  precision highp float;
  uniform sampler2D logoTex;
  uniform sampler2D videoTex;
  uniform float reveal;
  uniform float time;
  uniform vec2 resolution;
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
    // Crops both the logo and the video's own padded margins down to a
    // tight fit, matching the plain <img> logo's object-cover crop below
    // this canvas — see ASSET_UV_MARGIN above.
    vec2 assetUv = vec2(vUv.x, mix(${ASSET_UV_MARGIN.toFixed(4)}, ${(1 - ASSET_UV_MARGIN).toFixed(4)}, vUv.y));
    float logoAlpha = texture2D(logoTex, assetUv).a;

    // vUv.y = 1 is the top of the canvas (bottom-left-origin UV) — the
    // wipe line starts there (threshold 1, nothing above it, so nothing
    // revealed yet) and descends toward 0 as reveal grows toward 1,
    // revealing the video top-down.
    float wobble = (waveNoise(vUv.x * ${WIPE_WOBBLE_FREQ.toFixed(1)} + time * 0.15) - 0.5) * ${WIPE_WOBBLE_AMOUNT.toFixed(3)};
    float wipeThreshold = 1.0 - reveal + wobble;
    float revealField = smoothstep(wipeThreshold - ${WIPE_EDGE_SOFTNESS.toFixed(3)}, wipeThreshold + ${WIPE_EDGE_SOFTNESS.toFixed(3)}, vUv.y);

    // The clip is built to the logo's own proportions (see the note up
    // top) and carries the same kind of padding, so the same crop applies.
    vec3 videoColor = texture2D(videoTex, assetUv).rgb;

    // The video is real 3D footage — the balloon letters it shows are
    // rounder and chunkier than the flat 2D glyph outlines in logo.png,
    // so they don't actually fit inside that flat silhouette. Clipping
    // the reveal to logoAlpha (an earlier version did, to keep the
    // "outside" area transparent before the wipe reached it) cut into
    // the video's own shapes and showed as a hard rectangular seam at
    // each glyph's flat bounding box. logoAlpha is only used pre-wipe,
    // to draw the plain flat black mark; once the wipe passes a pixel,
    // alpha goes fully opaque with no dependency on the glyph shape at
    // all — the video's own (already white) background carries the rest
    // of the canvas seamlessly against the page.
    vec3 finalColor = mix(vec3(0.0), videoColor, revealField);
    float finalAlpha = mix(logoAlpha, 1.0, revealField);

    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;

export interface LogoLiquidRevealHandle {
  /** Fires the one-shot reveal: a fast top-to-bottom wipe from the plain
   * black logo to the video, which then plays forward once in real time
   * and holds on its last frame. Idempotent — calling it again after the
   * first time does nothing. */
  trigger: () => void;
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
  const triggerFnRef = useRef<(() => void) | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useImperativeHandle(ref, () => ({
    trigger: () => {
      triggerFnRef.current?.();
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion) return;

    let disposed = false;
    let rafId: number | null = null;
    let triggerTime: number | null = null;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
    renderer.setClearColor(0x000000, 0);
    renderer.autoClear = false;

    // Must be attached to the DOM (even if invisible) — a detached
    // <video> never reliably decodes frames, which left the texture
    // permanently black no matter what the shader did with it.
    const video = document.createElement("video");
    video.src = videoSrc;
    video.loop = false;
    video.muted = true;
    video.playsInline = true;
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
        reveal: { value: 0 },
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(1, 1) },
      },
      vertexShader: COMPOSE_VERTEX_SHADER,
      fragmentShader: COMPOSE_FRAGMENT_SHADER,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let ready = false;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(rect.width, rect.height, false);
      material.uniforms.resolution.value.set(rect.width, rect.height);

      if (ready) {
        renderer.setRenderTarget(null);
        renderer.render(scene, camera);
      }
    };

    const startLoop = () => {
      if (rafId === null) rafId = requestAnimationFrame(step);
    };

    const step = (now: number) => {
      const t = now * 0.001;

      if (triggerTime !== null) {
        const elapsed = (now - triggerTime) / 1000;
        const revealT = Math.min(1, Math.max(0, elapsed / REVEAL_DURATION));
        // Ease-out — snaps in fast, settles gently, rather than a
        // constant-speed wipe.
        const eased = 1 - Math.pow(1 - revealT, 3);
        material.uniforms.reveal.value = eased;
      }

      material.uniforms.time.value = t;
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);

      rafId = requestAnimationFrame(step);
    };

    triggerFnRef.current = () => {
      if (triggerTime !== null) return; // idempotent — already fired
      triggerTime = performance.now();
      video.currentTime = 0;
      video.play().catch(() => {});
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

      // Priming: iOS Safari can leave programmatic currentTime seeks
      // doing nothing visually until the video has been through one real
      // play/pause cycle — this is safe without a user gesture since
      // it's muted, and gives the texture a real frame-0 image to hold
      // (instead of a blank/garbage frame) until `trigger()` is called.
      video.play().then(() => video.pause()).catch(() => {});
    });

    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);

    startLoop();

    return () => {
      disposed = true;
      ro.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
      triggerFnRef.current = null;
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

  return <canvas ref={canvasRef} aria-hidden="true" className={className} style={{ pointerEvents: "none" }} />;
});

export default LogoLiquidReveal;
