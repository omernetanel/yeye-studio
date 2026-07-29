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

// The scroll-driven reveal is a plain top-to-bottom wipe now (not the
// circular growing-seed pattern this replaced) — WIPE_EDGE_SOFTNESS is
// how wide the transition band is (in UV units), WIPE_WOBBLE_* give it a
// slightly irregular, hand-drawn edge instead of a perfectly straight
// line, consistent with the hover trail's own organic edges elsewhere in
// this shader.
const WIPE_EDGE_SOFTNESS = 0.035;
const WIPE_WOBBLE_AMOUNT = 0.025;
const WIPE_WOBBLE_FREQ = 4.0;

const COMPOSE_FRAGMENT_SHADER = `
  precision highp float;
  uniform sampler2D logoTex;
  uniform sampler2D videoTex;
  uniform sampler2D trailTex;
  uniform float scrollReveal;
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
    float trailVal = texture2D(trailTex, vUv).r;

    // vUv.y = 1 is the top of the canvas (bottom-left-origin UV) — the
    // wipe line starts there (threshold 1, nothing above it, so nothing
    // revealed yet) and descends toward 0 as scrollReveal grows toward 1,
    // revealing the video top-down rather than the old bottom-up "water
    // filling the letters" motion.
    float wobble = (waveNoise(vUv.x * ${WIPE_WOBBLE_FREQ.toFixed(1)} + time * 0.15) - 0.5) * ${WIPE_WOBBLE_AMOUNT.toFixed(3)};
    float wipeThreshold = 1.0 - scrollReveal + wobble;
    float scrollField = smoothstep(wipeThreshold - ${WIPE_EDGE_SOFTNESS.toFixed(3)}, wipeThreshold + ${WIPE_EDGE_SOFTNESS.toFixed(3)}, vUv.y);

    // The clip is built to the logo's own proportions (see the note up
    // top) and carries the same kind of padding, so the same crop applies.
    vec3 videoColor = texture2D(videoTex, assetUv).rgb;

    // Neither reveal source (hover trail or scroll wipe) is confined to
    // the letter shapes — both paint the same way, composited identically
    // below. Inside the letters the base really is solid black, so
    // blending black -> video as either grows is correct: that's this
    // canvas's whole "liquid fills the mark" premise.
    float revealField = clamp(max(trailVal, scrollField), 0.0, 1.0);
    vec3 insideColor = mix(vec3(0.0), videoColor, revealField);

    // Outside the letters there is no black to blend from at all — mixing
    // toward black there (an earlier version, applied only to the hover
    // trail) faded the reveal's soft edges through gray on the way to
    // full color, compositing as a murky smudge against the solid black
    // backing image behind this canvas. Outside the glyphs, either reveal
    // source instead shows the video at full, undiluted color
    // immediately, fading in purely via alpha — a clean edge against the
    // page's own white background, nothing blended toward black.
    float outsideWeight = (1.0 - logoAlpha) * revealField;

    vec3 finalColor = mix(insideColor, videoColor, outsideWeight);
    float outAlpha = max(logoAlpha, outsideWeight);

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
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(1, 1) },
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
