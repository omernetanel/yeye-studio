"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Mesh, Plane, Program, RenderTarget, Renderer, Texture, Triangle } from "ogl";

import "./FlexCarousel.css";

/**
 * A ROW OF WORK SEEN THROUGH A PANE OF GLASS NOBODY CAN SEE.
 *
 * Derived from React Bits' FlexCarousel (MIT + Commons Clause - the notice the
 * licence requires is in THIRD_PARTY_NOTICES.md). The row is drawn into an
 * offscreen texture, and a full-screen pass bends it where it crosses the edge
 * of an invisible lens, splitting the light a little at the bend.
 *
 * WHAT CHANGED FROM THE ORIGINAL, and why:
 * - No sample photos. They were hot-linked from Unsplash, which this site's
 *   content policy blocks, and there is never a carousel here without work in it.
 * - No zoom on click. The original "opens" the centred card in place; here the
 *   centred card is a way into the project's own page, which already shows the
 *   live site inside YEYE, so a zoom on the way there would be one more click
 *   for nothing. A click on the centred card calls onSelect; a click on one at
 *   the side brings it to the centre.
 * - No autoplay and no built-in caption. The section around it prints its own
 *   caption - the name as a real link, the kind of work, and the site's circles.
 * - The wheel is the page's. A vertical wheel or thumb scrolls the page, and
 *   the row moves to a sideways drag, a sideways trackpad swipe or the arrow
 *   keys - and to a vertical wheel only over the middle band, if one is set.
 * - Reduced motion comes from the site, which folds the reader's own switch in
 *   with the operating system's, rather than from the media query alone.
 */

export interface FlexCarouselItem {
  src: string;
  alt: string;
  title: string;
}

type Preset = "liquid" | "ribbon" | "vortex" | "arch";
type Intro = "rise" | "bloom" | "spin" | "deal" | "none";
type Fit = "natural" | "portrait" | "square" | "landscape";
type Curl = "twist" | "rise" | "fall";

interface Lens {
  lensWidth: number;
  lensHeight: number;
  tilt: number;
  roundness: number;
  bend: number;
  reach: number;
  curl: Curl;
  dispersion: number;
  liquid: number;
}

const BEND_PRESETS: Record<Preset, Lens> = {
  liquid: { lensWidth: 0.74, lensHeight: 1.18, tilt: 62, roundness: 1, bend: 0.34, reach: 0.38, curl: "twist", dispersion: 0.45, liquid: 0 },
  ribbon: { lensWidth: 0.8, lensHeight: 0.8, tilt: 0, roundness: 1, bend: 0.34, reach: 0.34, curl: "twist", dispersion: 0.4, liquid: 0 },
  vortex: { lensWidth: 0.7, lensHeight: 0.95, tilt: 30, roundness: 1, bend: 0.46, reach: 0.3, curl: "twist", dispersion: 0.5, liquid: 0 },
  arch: { lensWidth: 0.8, lensHeight: 0.8, tilt: 0, roundness: 1, bend: 0.3, reach: 0.36, curl: "rise", dispersion: 0.4, liquid: 0 },
};

const FIT_ASPECT: Partial<Record<Fit, number>> = { portrait: 0.75, square: 1, landscape: 4 / 3 };
const TAPS = 12;
const PIXEL_BUDGET = 4.5e6;
const INTRO_DURATION: Record<Exclude<Intro, "none"> | "fade", number> = { rise: 2.1, bloom: 1.6, spin: 2.2, deal: 1.5, fade: 0.35 };

const wrap = (value: number, size: number) => ((((value + size / 2) % size) + size) % size) - size / 2;
const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const easeOut = (value: number) => 1 - Math.pow(1 - clamp01(value), 3);
const easeOutQuint = (value: number) => 1 - Math.pow(1 - clamp01(value), 5);
const easeInOut = (value: number) => {
  const t = clamp01(value);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

const cardVertex = `#version 300 es
in vec3 position;
in vec2 uv;
uniform vec4 uRect;
uniform vec2 uResolution;
out vec2 vUv;
out vec2 vLocal;
void main() {
  vUv = uv;
  vLocal = vec2(position.x, -position.y) * uRect.zw;
  vec2 px = uRect.xy + vLocal;
  gl_Position = vec4(px.x / uResolution.x * 2.0 - 1.0, 1.0 - px.y / uResolution.y * 2.0, 0.0, 1.0);
}
`;

const cardFragment = `#version 300 es
precision highp float;
uniform sampler2D tMap;
uniform vec2 uSize;
uniform vec2 uImage;
uniform float uRadius;
uniform float uAlpha;
uniform float uReady;
uniform float uShift;
uniform float uDpr;
uniform vec3 uPlaceholder;
in vec2 vUv;
in vec2 vLocal;
out vec4 fragColor;

float roundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  float sd = roundedBox(vLocal, uSize * 0.5, min(uRadius, min(uSize.x, uSize.y) * 0.5));
  float mask = clamp(0.5 - sd * uDpr, 0.0, 1.0);
  vec2 local = vLocal / uSize + 0.5;
  float cardAspect = uSize.x / uSize.y;
  float imageAspect = uImage.x / max(uImage.y, 1.0);
  vec2 scale = imageAspect > cardAspect ? vec2(cardAspect / imageAspect, 1.0) : vec2(1.0, imageAspect / cardAspect);
  scale /= 1.08;
  vec2 uv = vec2(local.x, 1.0 - local.y);
  uv = (uv - 0.5) * scale + 0.5;
  uv.x += uShift * (1.0 - scale.x) * 0.5;
  vec3 image = texture(tMap, uv).rgb;
  vec3 color = mix(uPlaceholder, image, uReady);
  float alpha = mask * uAlpha;
  fragColor = vec4(color * alpha, alpha);
}
`;

const lensVertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const lensFragment = `#version 300 es
precision highp float;
uniform sampler2D tScene;
uniform vec2 uResolution;
uniform float uDpr;
uniform vec2 uCenter;
uniform vec2 uHalf;
uniform float uAngle;
uniform float uExponent;
uniform float uInner;
uniform float uOuter;
uniform float uFlow;
uniform float uCurl;
uniform float uDispersion;
uniform float uStrength;
uniform float uSceneAlpha;
uniform float uMaxLift;
uniform float uBlur;
uniform float uEdgeDim;
uniform float uFlatHalf;
out vec4 fragColor;

void main() {
  vec2 frag = gl_FragCoord.xy / uDpr;
  vec2 uv = frag / uResolution;
  vec2 rel = frag - vec2(uCenter.x, uResolution.y - uCenter.y);
  float ca = cos(uAngle);
  float sa = sin(uAngle);
  vec2 local = vec2(ca * rel.x + sa * rel.y, -sa * rel.x + ca * rel.y);
  vec2 k = max(abs(local) / uHalf, vec2(1e-5));
  float nd = pow(pow(k.x, uExponent) + pow(k.y, uExponent), 1.0 / uExponent);
  vec2 grad = pow(k, vec2(uExponent - 1.0)) * sign(local) / uHalf * pow(nd, 1.0 - uExponent);
  float glen = max(length(grad), 1e-6);
  float edge = (nd - 1.0) / glen;
  vec2 outward = grad / glen;
  vec2 normal = vec2(ca * outward.x - sa * outward.y, sa * outward.x + ca * outward.y);
  vec2 along = vec2(-normal.y, normal.x);

  float t = clamp((edge + uInner) / (uInner + uOuter), 0.0, 1.0);
  float ramp = t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  float slope = 16.0 * t * t * (1.0 - t) * (1.0 - t);
  float reachX = rel.x / (uResolution.x * 0.5);
  float side = smoothstep(0.02, 0.3, abs(reachX)) * (uCurl == 0.0 ? sign(reachX) : uCurl);
  float lift = ramp * side * uFlow * uStrength;
  vec2 swirl = along * along.y * side * slope * uFlow * uStrength * 0.35;
  vec2 drift = vec2(0.0, -lift) - swirl;
  // A soft ceiling on the whole vertical move - the lift and the swirl
  // together: the wave keeps its shape but never carries a card further than
  // the room between the row and the box's edge, so nothing is cut off by the
  // canvas. Capping the lift alone left the swirl to push it ~100px past.
  if (uMaxLift > 0.0) drift.y = uMaxLift * tanh(drift.y / uMaxLift);
  vec2 shifted = uv + drift / uResolution;

  vec2 texels = uResolution * uDpr;
  vec2 gx = dFdx(shifted);
  vec2 gy = dFdy(shifted);
  gx *= min(1.0, 3.0 / max(length(gx * texels), 1e-4));
  gy *= min(1.0, 3.0 / max(length(gy * texels), 1e-4));

  vec4 color = textureGrad(tScene, shifted, gx, gy);
  // Out of focus where the glass bends: a coarser mip of the same pixels, as
  // much as the bend is under way.
  if (uBlur > 0.0) color = mix(color, textureLod(tScene, shifted, uBlur), ramp);
  vec2 spread = vec2(0.0, side * slope * uFlow * uStrength) / uResolution * uDispersion;
  float spreadPx = length(spread * texels);
  if (color.a > 0.002 && spreadPx > 0.25) {
    vec3 base = color.rgb / color.a;
    vec3 sumColor = vec3(0.0);
    vec3 sumWeight = vec3(0.0);
    for (int i = 0; i < ${TAPS}; i++) {
      float s = (float(i) + 0.5) / float(${TAPS});
      vec4 c = textureGrad(tScene, shifted + spread * (s - 0.5), gx, gy);
      vec3 w = max(1.0 - abs(vec3(s) - vec3(0.15, 0.5, 0.85)) * 2.6, 0.0) * c.a;
      sumColor += c.rgb * (w / max(c.a, 0.002));
      sumWeight += w;
    }
    vec3 split = mix(base, sumColor / max(sumWeight, vec3(1e-4)), clamp(sumWeight * 2.0, 0.0, 1.0));
    color.rgb = mix(color.rgb, clamp(split, 0.0, 1.0) * color.a, smoothstep(0.25, 1.5, spreadPx));
  }

  // Thinner towards the screen's edges: nothing inside the flat middle, and
  // more the further out a pixel sits.
  color *= 1.0 - uEdgeDim * smoothstep(uFlatHalf, uResolution.x * 0.5, abs(frag.x - uCenter.x));

  fragColor = color * uSceneAlpha;
}
`;

interface Settings extends Lens {
  intro: Intro;
  cardHeight: number;
  gap: number;
  radius: number;
  fit: Fit;
  squeeze: number;
  flatMargin: number | undefined;
  captureWheel: boolean;
  wheelZone: number;
  contain: boolean;
  blur: number;
  sideOpacity: number;
  edgeDim: number;
  reducedMotion: boolean;
}

interface Slot {
  item: FlexCarouselItem;
  texture: Texture;
  aspect: number;
  loaded: boolean;
  failed: boolean;
  ready: number;
  color: [number, number, number];
  image: [number, number];
  dispose: () => void;
}

interface Metrics {
  cardH: number;
  widths: number[];
  centers: number[];
  gap: number;
  loop: number;
}

interface CardEffect {
  alpha: number;
  x: number;
  y: number;
  scale: number;
}

interface Hit {
  index: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface FlexCarouselProps extends Partial<Lens> {
  items: FlexCarouselItem[];
  /** What the region is called to a screen reader. */
  label: string;
  preset?: Preset;
  intro?: Intro;
  fit?: Fit;
  /** Card height as a fraction of the container's height. */
  cardHeight?: number;
  gap?: number;
  radius?: number;
  /** How much the cards shrink while the row moves fast. */
  squeeze?: number;
  /**
   * Px of flat glass kept on each side of the centred card. When set, the lens
   * is sized from the card and lensWidth is ignored.
   */
  flatMargin?: number;
  /** Whether a vertical wheel moves the row. Off here: the page owns vertical. */
  captureWheel?: boolean;
  /**
   * A band in the middle, as a share of the width, where a vertical wheel moves
   * the row. Outside it the wheel scrolls the page as usual - the row loops
   * forever, so the sides are the way out and must stay free.
   */
  wheelZone?: number;
  /** Cap the wave so a bent card never leaves the box and is never cut. */
  contain?: boolean;
  /** Blur where the glass bends, as a mip level (0 = sharp, ~2-3 = soft). */
  blur?: number;
  /** Opacity of a card one step from the centre (1 = as solid as the centre). */
  sideOpacity?: number;
  /** How much thinner the row gets at the screen's edges (0 = none). */
  edgeDim?: number;
  reducedMotion?: boolean;
  /** Called whenever a different card reaches the centre. */
  onChange?: (index: number) => void;
  /** Called when the centred card is clicked, or Enter is pressed. */
  onSelect?: (index: number) => void;
  className?: string;
  style?: CSSProperties;
}

export default function FlexCarousel({
  items,
  label,
  preset = "liquid",
  intro = "rise",
  cardHeight = 0.5,
  gap = 12,
  radius = 0,
  fit = "natural",
  lensWidth,
  lensHeight,
  tilt,
  roundness,
  bend,
  reach,
  curl,
  dispersion,
  liquid,
  squeeze = 0.2,
  flatMargin,
  captureWheel = false,
  wheelZone = 0,
  contain = false,
  blur = 0,
  sideOpacity = 1,
  edgeDim = 0,
  reducedMotion = false,
  onChange,
  onSelect,
  className = "",
  style,
}: FlexCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<Settings | null>(null);
  const itemsRef = useRef(items);
  const engineRef = useRef<{ wake: () => void; setItems: (next: FlexCarouselItem[]) => void } | null>(null);
  const callbacksRef = useRef({ onChange, onSelect });
  const [active, setActive] = useState(0);

  const base = BEND_PRESETS[preset];
  const itemsKey = items.map((item) => item.src).join("|");

  useEffect(() => {
    itemsRef.current = items;
    callbacksRef.current = { onChange, onSelect };
    settingsRef.current = {
      intro,
      cardHeight,
      gap,
      radius,
      fit,
      lensWidth: lensWidth ?? base.lensWidth,
      lensHeight: lensHeight ?? base.lensHeight,
      tilt: tilt ?? base.tilt,
      roundness: roundness ?? base.roundness,
      bend: bend ?? base.bend,
      reach: reach ?? base.reach,
      curl: curl ?? base.curl,
      dispersion: dispersion ?? base.dispersion,
      liquid: liquid ?? base.liquid,
      squeeze,
      flatMargin,
      captureWheel,
      wheelZone,
      contain,
      blur,
      sideOpacity,
      edgeDim,
      reducedMotion,
    };
    engineRef.current?.wake();
  });

  useEffect(() => {
    engineRef.current?.setItems(itemsRef.current);
  }, [itemsKey]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
    });
    const gl = renderer.gl;
    if (!renderer.isWebgl2) {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      return undefined;
    }
    gl.clearColor(0, 0, 0, 0);
    const canvas = gl.canvas;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.setAttribute("aria-hidden", "true");
    container.prepend(canvas);

    const cardProgram = new Program(gl, {
      vertex: cardVertex,
      fragment: cardFragment,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tMap: { value: new Texture(gl) },
        uRect: { value: [0, 0, 1, 1] },
        uResolution: { value: [1, 1] },
        uSize: { value: [1, 1] },
        uImage: { value: [1, 1] },
        uRadius: { value: 16 },
        uAlpha: { value: 1 },
        uReady: { value: 0 },
        uShift: { value: 0 },
        uDpr: { value: 1 },
        uPlaceholder: { value: [0.5, 0.5, 0.5] },
      },
    });
    cardProgram.setBlendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const cardMesh = new Mesh(gl, { geometry: new Plane(gl), program: cardProgram });

    const target = new RenderTarget(gl, {
      width: 2,
      height: 2,
      depth: false,
      minFilter: gl.LINEAR_MIPMAP_LINEAR,
      magFilter: gl.LINEAR,
    });

    const lensUniforms = {
      tScene: { value: target.texture },
      uResolution: { value: [1, 1] },
      uDpr: { value: 1 },
      uCenter: { value: [0, 0] },
      uHalf: { value: [1, 1] },
      uAngle: { value: 0 },
      uExponent: { value: 2 },
      uInner: { value: 60 },
      uOuter: { value: 80 },
      uFlow: { value: 0 },
      uCurl: { value: 0 },
      uDispersion: { value: 0 },
      uStrength: { value: 0 },
      uSceneAlpha: { value: 0 },
      uMaxLift: { value: 0 },
      uBlur: { value: 0 },
      uEdgeDim: { value: 0 },
      uFlatHalf: { value: 0 },
    };
    const lensMesh = new Mesh(gl, {
      geometry: new Triangle(gl),
      program: new Program(gl, {
        vertex: lensVertex,
        fragment: lensFragment,
        uniforms: lensUniforms,
        depthTest: false,
        depthWrite: false,
      }),
    });

    const anisotropy = renderer.getExtension("EXT_texture_filter_anisotropic") ? 8 : 0;

    let slots: Slot[] = [];
    let width = 1;
    let height = 1;
    let pos = 0;
    let vel = 0;
    let goal = 0;
    let mode: "spring" | "wheel" = "spring";
    let wheelAt = 0;
    let raf = 0;
    let last = performance.now();
    let visible = true;
    let alive = true;
    let dirty = true;
    let activeIndex = -1;
    let deform = 0;
    let deformVel = 0;
    let layout: Metrics | null = null;
    let resnap = false;
    let hover = "";
    let energy = 0;
    let lastPos = 0;
    const lens = { x: 0, y: 0, vx: 0, vy: 0, ready: false };
    const pointer = {
      x: 0,
      y: 0,
      over: false,
      down: false,
      id: -1,
      startX: 0,
      startY: 0,
      startPos: 0,
      dragging: false,
      touch: false,
      samples: [] as { x: number; t: number }[],
    };
    const introState = { kind: "none" as Intro | "fade", t: 0, running: false, done: false, readyAt: 0 };
    let instances: Hit[] = [];

    const loadSlot = (item: FlexCarouselItem): Slot => {
      const texture = new Texture(gl, {
        generateMipmaps: true,
        minFilter: gl.LINEAR_MIPMAP_LINEAR,
        magFilter: gl.LINEAR,
        anisotropy,
      });
      const slot: Slot = {
        item,
        texture,
        aspect: 0.8,
        loaded: false,
        failed: false,
        ready: 0,
        color: [0.5, 0.5, 0.5],
        image: [1, 1],
        dispose: () => {},
      };
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        if (!alive || !slots.includes(slot)) return;
        texture.image = image;
        texture.update();
        slot.image = [image.naturalWidth || 1, image.naturalHeight || 1];
        slot.aspect = slot.image[0] / slot.image[1];
        // The card's placeholder colour while it fades in: the picture's own
        // average, read off an 8px copy of it.
        const probe = document.createElement("canvas");
        probe.width = 8;
        probe.height = 8;
        const ctx = probe.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(image, 0, 0, 8, 8);
          const data = ctx.getImageData(0, 0, 8, 8).data;
          const avg = [0, 0, 0];
          for (let i = 0; i < data.length; i += 4) {
            avg[0] += data[i];
            avg[1] += data[i + 1];
            avg[2] += data[i + 2];
          }
          slot.color = [avg[0] / 64 / 255, avg[1] / 64 / 255, avg[2] / 64 / 255];
        }
        slot.loaded = true;
        dirty = true;
        start();
      };
      image.onerror = () => {
        if (!alive) return;
        slot.failed = true;
        dirty = true;
        start();
      };
      image.src = item.src;
      slot.dispose = () => {
        image.onload = null;
        image.onerror = null;
        gl.deleteTexture(texture.texture);
      };
      return slot;
    };

    const setItems = (next: FlexCarouselItem[]) => {
      slots.forEach((slot) => slot.dispose());
      slots = next.map(loadSlot);
      activeIndex = -1;
      layout = null;
      resnap = true;
      introState.readyAt = performance.now();
      dirty = true;
      start();
    };

    const metrics = (s: Settings): Metrics => {
      const cardH = Math.max(24, s.cardHeight * height);
      const fixed = FIT_ASPECT[s.fit];
      const widths = slots.map((slot) => (fixed || slot.aspect) * cardH);
      const centers: number[] = [];
      let cursor = 0;
      for (let i = 0; i < widths.length; i++) {
        centers.push(cursor + widths[i] / 2);
        cursor += widths[i] + s.gap;
      }
      return { cardH, widths, centers, gap: s.gap, loop: Math.max(cursor, 1) };
    };

    const nearest = (m: Metrics, at: number) => {
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < m.centers.length; i++) {
        const dist = Math.abs(wrap(m.centers[i] - at, m.loop));
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      }
      return best;
    };

    const snapPoint = (m: Metrics, at: number) => {
      const i = nearest(m, at);
      return at + wrap(m.centers[i] - at, m.loop);
    };

    const remap = (from: Metrics, to: Metrics, at: number) => {
      const i = nearest(from, at);
      const offset = wrap(at - from.centers[i], from.loop);
      const cycles = Math.round((at - offset - from.centers[i]) / from.loop);
      return cycles * to.loop + to.centers[i] + offset * (to.widths[i] / from.widths[i]);
    };

    const step = (m: Metrics, delta: number) => {
      let at = snapPoint(m, goal);
      let index = nearest(m, at);
      const n = m.centers.length;
      for (let k = 0; k < Math.abs(delta); k++) {
        const next = (index + (delta > 0 ? 1 : n - 1)) % n;
        const distance =
          delta > 0
            ? m.widths[index] / 2 + m.gap + m.widths[next] / 2
            : -(m.widths[next] / 2 + m.gap + m.widths[index] / 2);
        at += distance;
        index = next;
      }
      goal = at;
      mode = "spring";
      dirty = true;
      start();
    };

    const goTo = (m: Metrics, index: number) => {
      const i = ((index % m.centers.length) + m.centers.length) % m.centers.length;
      goal = goal + wrap(m.centers[i] - goal, m.loop);
      mode = "spring";
      dirty = true;
      start();
    };

    const skipIntro = () => {
      if (introState.running) introState.t = 1;
    };

    const introEffects = () => {
      const t = introState.running ? introState.t : introState.done ? 1 : 0;
      const e: { sceneAlpha: number; strength: number; card: ((rel: number) => CardEffect) | null } = {
        sceneAlpha: 1,
        strength: 1,
        card: null,
      };
      if (!introState.done && !introState.running) {
        e.sceneAlpha = 0;
        e.strength = 0;
        return e;
      }
      if (t >= 1) return e;
      const kind = introState.kind;
      if (kind === "rise") {
        e.strength = easeInOut((t - 0.3) / 0.65);
        e.card = (rel) => {
          const delay = Math.min(Math.abs(rel) / (width * 0.6), 1) * 0.34;
          const local = clamp01((t - delay) / 0.6);
          return {
            alpha: clamp01(local * 4),
            x: 0,
            y: (1 - easeOutQuint(local)) * height * 0.62,
            scale: 0.5 + 0.5 * easeInOut((local - 0.18) / 0.82),
          };
        };
      } else if (kind === "bloom") {
        e.strength = easeInOut((t - 0.2) / 0.8);
        e.card = (rel) => {
          const delay = Math.min(Math.abs(rel) / (width * 0.6), 1) * 0.25;
          const local = easeOut((t - delay) / 0.55);
          return { alpha: local, x: 0, y: 0, scale: 0.92 + 0.08 * local };
        };
      } else if (kind === "spin") {
        e.sceneAlpha = easeOut(t / 0.25);
        e.strength = easeOut((t - 0.55) / 0.45);
      } else if (kind === "deal") {
        e.strength = easeOut((t - 0.45) / 0.5);
        e.card = (rel) => {
          const spread = Math.min(Math.abs(rel) / (width * 0.6), 1) * 0.3;
          const local = easeOut((t - 0.12 - spread) / 0.5);
          return { alpha: easeOut((t - spread) / 0.12), x: -rel * (1 - local), y: 0, scale: 1 };
        };
      } else {
        e.sceneAlpha = easeOut(t);
        e.strength = easeOut(t);
      }
      return e;
    };

    const beginIntro = (s: Settings, m: Metrics) => {
      const kind: Intro | "fade" = s.reducedMotion && s.intro !== "none" ? "fade" : s.intro;
      introState.kind = kind;
      introState.running = kind !== "none";
      introState.done = !introState.running;
      introState.t = 0;
      if (kind === "spin") {
        const distance = m.loop * 1.6 + width;
        pos = goal + distance;
        vel = -distance * 3;
        mode = "spring";
      }
    };

    const resize = () => {
      width = Math.max(1, container.clientWidth);
      height = Math.max(1, container.clientHeight);
      renderer.dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(PIXEL_BUDGET / (width * height)));
      renderer.setSize(width, height);
      target.setSize(Math.max(2, Math.round(width * renderer.dpr)), Math.max(2, Math.round(height * renderer.dpr)));
      lensUniforms.tScene.value = target.texture;
      dirty = true;
      start();
    };

    const frame = (now: number) => {
      raf = 0;
      if (!alive) return;
      const s = settingsRef.current;
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      if (!s || !slots.length) {
        if (visible) raf = requestAnimationFrame(frame);
        return;
      }
      const reducedMotion = s.reducedMotion;

      const m = metrics(s);
      const n = slots.length;
      let animating = false;

      if (resnap) {
        // A new row opens on its first piece. Snapping from 0 does not: 0 is the
        // first card's left edge, which is as near the last card as the first
        // once the widths differ.
        goal = m.centers[0];
        pos = goal;
        vel = 0;
        resnap = false;
      } else if (layout && layout.loop !== m.loop) {
        pos = remap(layout, m, pos);
        goal = remap(layout, m, goal);
        pointer.startPos = pos + (pointer.x - pointer.startX);
        animating = true;
      }
      layout = m;

      if (!introState.running && !introState.done) {
        const allSettled = slots.every((slot) => slot.loaded || slot.failed);
        if (allSettled || now - introState.readyAt > 3500) {
          goal = snapPoint(m, goal);
          pos = goal;
          beginIntro(s, m);
        }
      }
      if (introState.running) {
        const duration = introState.kind === "none" ? 1 : INTRO_DURATION[introState.kind];
        introState.t = Math.min(1, introState.t + dt / duration);
        if (introState.t >= 1) {
          introState.running = false;
          introState.done = true;
        }
        animating = true;
      }

      if (mode === "wheel" && now - wheelAt > 150) {
        goal = snapPoint(m, goal);
        mode = "spring";
      }
      if (!pointer.dragging) {
        const spinning = introState.running && introState.kind === "spin";
        const stiffness = spinning ? 9 : mode === "wheel" ? 80 : 55;
        const damping = 2 * Math.sqrt(stiffness);
        const steps = Math.ceil(dt / (1 / 240));
        const h = dt / steps;
        for (let i = 0; i < steps; i++) {
          const acc = stiffness * (goal - pos) - damping * vel;
          vel += acc * h;
          pos += vel * h;
        }
        if (Math.abs(goal - pos) < 0.05 && Math.abs(vel) < 0.5) {
          pos = goal;
          vel = 0;
        } else {
          animating = true;
        }
      } else {
        animating = true;
      }

      if (Math.abs(pos) > m.loop * 8) {
        const shift = Math.round(pos / m.loop) * m.loop;
        pos -= shift;
        goal -= shift;
        pointer.startPos -= shift;
      }

      const current = nearest(m, pos);
      if (current !== activeIndex) {
        activeIndex = current;
        setActive(current);
        callbacksRef.current.onChange?.(current);
      }

      const travel = Math.abs(pos - lastPos) / dt;
      lastPos = pos;
      const energyTarget = reducedMotion ? 0 : Math.min(travel / 2600, 1);
      energy += (energyTarget - energy) * (1 - Math.exp(-dt / (energyTarget > energy ? 0.07 : 0.35)));
      if (energy > 0.001) animating = true;
      const liquidAmount = reducedMotion ? 0 : s.liquid;
      const push = Math.max(-1, Math.min(1, vel / 2200));
      const deformStiffness = 120;
      const deformDamping = 2 * Math.sqrt(deformStiffness) * 0.32;
      deformVel += (deformStiffness * (push - deform) - deformDamping * deformVel) * dt;
      deform += deformVel * dt;
      if (Math.abs(deform) > 0.0005 || Math.abs(deformVel) > 0.005) animating = true;

      const effects = introEffects();

      const homeX = width / 2;
      const homeY = height / 2;
      if (!lens.ready) {
        lens.x = homeX;
        lens.y = homeY;
        lens.ready = true;
      }
      const lensK = 110;
      const lensC = 2 * Math.sqrt(lensK) * 0.8;
      lens.vx += (lensK * (homeX - lens.x) - lensC * lens.vx) * dt;
      lens.vy += (lensK * (homeY - lens.y) - lensC * lens.vy) * dt;
      lens.x += lens.vx * dt;
      lens.y += lens.vy * dt;
      if (Math.abs(homeX - lens.x) + Math.abs(homeY - lens.y) > 0.2 || Math.abs(lens.vx) + Math.abs(lens.vy) > 0.5)
        animating = true;

      const cardH = m.cardH;
      let halfH = (s.lensHeight * width) / 2;
      // The bend starts `inner` px inside the lens edge, and inner grows with
      // the lens. With flatMargin set, the width is solved so the flat middle
      // holds the centred card plus that margin at any screen size: the card
      // being read is never bent, only the ones beside it.
      let halfW =
        s.flatMargin === undefined
          ? (s.lensWidth * width) / 2
          : (m.widths[current] / 2 + s.flatMargin + (s.reach * halfH) / 2) / (1 - s.reach / 2);
      const squash = Math.abs(deform) * liquidAmount;
      halfW *= 1 + squash * 0.16;
      halfH *= 1 - squash * 0.08;
      const lensX = lens.x - deform * 14 * liquidAmount;

      for (let i = 0; i < n; i++) {
        const slot = slots[i];
        if (slot.loaded && slot.ready < 1) {
          slot.ready = Math.min(1, slot.ready + dt / 0.45);
          animating = true;
        }
      }

      const waiting = !introState.done;
      if (dirty || animating || pointer.dragging) {
        dirty = false;
        instances = [];
        const dpr = renderer.dpr;
        cardProgram.uniforms.uResolution.value = [width, height];
        cardProgram.uniforms.uDpr.value = dpr;
        cardProgram.uniforms.uRadius.value = s.radius;
        const shrink = 1 - clamp01(s.squeeze) * energy;
        const draws: { i: number; rel: number; x: number; y: number; cw: number; ch: number; alpha: number }[] = [];
        for (let i = 0; i < n; i++) {
          const w = m.widths[i];
          const baseRel = wrap(m.centers[i] - pos, m.loop);
          for (let k = -3; k <= 3; k++) {
            const rel = baseRel + k * m.loop;
            if (Math.abs(rel) - w / 2 > width + 40) continue;
            const fx = effects.card ? effects.card(rel) : null;
            const x = homeX + rel + (fx ? fx.x : 0);
            const scale = shrink * (fx ? fx.scale : 1);
            // The neighbours step back so the piece in the middle leads: they
            // thin out with their distance from the centre, so a card coming
            // in gains its weight as it arrives.
            const away = easeInOut(Math.abs(rel) / (w + m.gap));
            const alpha = (fx ? fx.alpha : 1) * (1 - (1 - s.sideOpacity) * away);
            const cw = w * scale;
            if (alpha <= 0.001 || x + cw / 2 < -40 || x - cw / 2 > width + 40) continue;
            draws.push({ i, rel, x, y: homeY + (fx ? fx.y : 0), cw, ch: cardH * scale, alpha });
          }
        }
        draws.sort((a, b) => Math.abs(b.rel) - Math.abs(a.rel));
        let first = true;
        for (const draw of draws) {
          const slot = slots[draw.i];
          cardProgram.uniforms.tMap.value = slot.texture;
          cardProgram.uniforms.uRect.value = [draw.x, draw.y, draw.cw + 2, draw.ch + 2];
          cardProgram.uniforms.uSize.value = [draw.cw, draw.ch];
          cardProgram.uniforms.uImage.value = slot.image;
          cardProgram.uniforms.uAlpha.value = draw.alpha;
          cardProgram.uniforms.uReady.value = slot.ready;
          cardProgram.uniforms.uShift.value = reducedMotion ? 0 : Math.max(-1, Math.min(1, draw.rel / (width * 0.75)));
          cardProgram.uniforms.uPlaceholder.value = slot.color;
          renderer.render({ scene: cardMesh, target, clear: first });
          first = false;
          instances.push({
            index: draw.i,
            x0: draw.x - draw.cw / 2,
            x1: draw.x + draw.cw / 2,
            y0: draw.y - draw.ch / 2,
            y1: draw.y + draw.ch / 2,
          });
        }
        if (first) {
          renderer.bindFramebuffer(target);
          gl.viewport(0, 0, target.width, target.height);
          gl.clear(gl.COLOR_BUFFER_BIT);
        }
        renderer.bindFramebuffer();
        target.texture.bind();
        gl.generateMipmap(gl.TEXTURE_2D);

        lensUniforms.uResolution.value = [width, height];
        lensUniforms.uDpr.value = dpr;
        lensUniforms.uCenter.value = [lensX, lens.y];
        lensUniforms.uHalf.value = [Math.max(halfW, 1), Math.max(halfH, 1)];
        lensUniforms.uAngle.value = (s.tilt * Math.PI) / 180;
        lensUniforms.uExponent.value = 2 + Math.pow(1 - clamp01(s.roundness), 1.5) * 10;
        const spanW = Math.max(halfW, 1);
        const spanH = Math.max(halfH, 1);
        const inner = Math.max(4, s.reach * (spanW + spanH) * 0.5);
        lensUniforms.uInner.value = inner;
        lensUniforms.uOuter.value = inner * 1.6;
        lensUniforms.uFlow.value = s.bend * (spanW + spanH) * 0.45;
        lensUniforms.uCurl.value = s.curl === "rise" ? 1 : s.curl === "fall" ? -1 : 0;
        lensUniforms.uDispersion.value = s.dispersion * 0.12 * (1 + Math.abs(deform) * liquidAmount * 1.2);
        lensUniforms.uStrength.value = effects.strength;
        lensUniforms.uSceneAlpha.value = effects.sceneAlpha;
        // Less a margin for the colour split, which smears a card's edge a few
        // pixels further than the card itself.
        lensUniforms.uMaxLift.value = s.contain ? Math.max(1, (height - cardH * shrink) / 2 - 18) : 0;
        lensUniforms.uBlur.value = s.blur;
        lensUniforms.uEdgeDim.value = s.edgeDim;
        lensUniforms.uFlatHalf.value = Math.max(0, spanW - inner);
        renderer.render({ scene: lensMesh });
      }

      // Over a card and not dragging: a click there goes somewhere.
      let nextHover = "";
      if (pointer.over && !pointer.dragging && introState.done) {
        const hit = instances.find(
          (inst) => pointer.x >= inst.x0 && pointer.x <= inst.x1 && pointer.y >= inst.y0 && pointer.y <= inst.y1
        );
        if (hit) nextHover = "open";
      }
      if (nextHover !== hover) {
        hover = nextHover;
        if (hover) container.setAttribute("data-hover", hover);
        else container.removeAttribute("data-hover");
      }

      if (visible && (animating || waiting || dirty || pointer.down)) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (raf || !visible || !alive) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const localPoint = (e: PointerEvent): [number, number] => {
      const rect = container.getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top];
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button > 0) return;
      skipIntro();
      const [x, y] = localPoint(e);
      pointer.down = true;
      pointer.id = e.pointerId;
      pointer.touch = e.pointerType === "touch";
      pointer.startX = x;
      pointer.startY = y;
      pointer.x = x;
      pointer.y = y;
      pointer.startPos = pos;
      pointer.dragging = false;
      pointer.samples = [{ x, t: performance.now() }];
      if (Math.abs(vel) > 40) {
        goal = pos;
        vel = 0;
      }
      dirty = true;
      start();
    };

    const onPointerMove = (e: PointerEvent) => {
      const [x, y] = localPoint(e);
      pointer.x = x;
      pointer.y = y;
      pointer.over = true;
      if (pointer.down && e.pointerId === pointer.id) {
        const dx = x - pointer.startX;
        const dy = y - pointer.startY;
        const slop = pointer.touch ? 10 : 5;
        if (!pointer.dragging) {
          // A thumb that moves more up or down than sideways is scrolling the
          // page, and the row lets go of it at once.
          if (pointer.touch && Math.abs(dy) > slop && Math.abs(dy) > Math.abs(dx)) {
            pointer.down = false;
            return;
          }
          if (Math.abs(dx) > slop) {
            pointer.dragging = true;
            pointer.startX = x;
            pointer.startPos = pos;
            try {
              container.setPointerCapture(e.pointerId);
            } catch {
              // The pointer already went away; the drag carries on without capture.
            }
            container.setAttribute("data-dragging", "");
          }
        }
        if (pointer.dragging) {
          pos = pointer.startPos - (x - pointer.startX);
          goal = pos;
          vel = 0;
          const now = performance.now();
          pointer.samples.push({ x, t: now });
          while (pointer.samples.length > 2 && now - pointer.samples[0].t > 100) pointer.samples.shift();
        }
      }
      dirty = true;
      start();
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!pointer.down || e.pointerId !== pointer.id) return;
      pointer.down = false;
      container.removeAttribute("data-dragging");
      const s = settingsRef.current;
      if (!s) return;
      const m = metrics(s);
      if (pointer.dragging) {
        pointer.dragging = false;
        const now = performance.now();
        const first = pointer.samples[0];
        const lastSample = pointer.samples[pointer.samples.length - 1];
        let velocity = 0;
        if (first && lastSample && lastSample.t > first.t && now - lastSample.t < 70) {
          velocity = -((lastSample.x - first.x) / (lastSample.t - first.t)) * 1000;
        }
        vel = velocity;
        const landing = snapPoint(m, pos + velocity * 0.32);
        goal = landing;
        if (Math.abs(velocity) > 400 && Math.abs(landing - pos) < 1) step(m, velocity > 0 ? 1 : -1);
        mode = "spring";
        start();
        return;
      }
      const [x, y] = localPoint(e);
      const hit = instances.find((inst) => x >= inst.x0 && x <= inst.x1 && y >= inst.y0 && y <= inst.y1);
      if (!hit) return;
      if (hit.index === activeIndex && Math.abs(goal - pos) < 2) {
        callbacksRef.current.onSelect?.(hit.index);
      } else {
        const rel = (hit.x0 + hit.x1) / 2 - width / 2;
        goal = snapPoint(m, pos + rel);
        mode = "spring";
        start();
      }
    };

    const onPointerLeave = () => {
      pointer.over = false;
      dirty = true;
      start();
    };

    const onPointerCancel = () => {
      pointer.down = false;
      pointer.dragging = false;
      container.removeAttribute("data-dragging");
      const s = settingsRef.current;
      if (!s) return;
      goal = snapPoint(metrics(s), pos);
      mode = "spring";
      start();
    };

    const onWheel = (e: WheelEvent) => {
      const s = settingsRef.current;
      if (!s || e.ctrlKey) return;
      let dx = e.deltaX;
      let dy = e.deltaY;
      if (e.shiftKey && Math.abs(dx) < Math.abs(dy)) {
        dx = dy;
        dy = 0;
      }
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? height : 1;
      const horizontal = Math.abs(dx) > Math.abs(dy);
      // Vertical belongs to the page, except over the middle band.
      const inZone = Math.abs(e.clientX - container.getBoundingClientRect().left - width / 2) <= (s.wheelZone * width) / 2;
      if (!horizontal && !s.captureWheel && !inZone) return;
      e.preventDefault();
      // And out of Lenis's reach: it listens on the window, and would scroll
      // the page under the row as well.
      e.stopPropagation();
      skipIntro();
      const delta = Math.max(-120, Math.min(120, (horizontal ? dx : dy) * unit));
      goal += delta * 1.25;
      mode = "wheel";
      wheelAt = performance.now();
      start();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const s = settingsRef.current;
      if (!s) return;
      const m = metrics(s);
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        skipIntro();
        step(m, 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        skipIntro();
        step(m, -1);
      } else if (e.key === "Home") {
        e.preventDefault();
        goTo(m, 0);
      } else if (e.key === "End") {
        e.preventDefault();
        goTo(m, slots.length - 1);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (activeIndex >= 0) callbacksRef.current.onSelect?.(activeIndex);
      }
    };

    const onVisibility = () => {
      if (!document.hidden) start();
    };

    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("pointerleave", onPointerLeave);
    container.addEventListener("pointercancel", onPointerCancel);
    container.addEventListener("wheel", onWheel, { passive: false });
    container.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibility);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    // Nothing is drawn while the row is off the screen.
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    });
    intersectionObserver.observe(container);

    engineRef.current = {
      wake: () => {
        dirty = true;
        start();
      },
      setItems,
    };

    resize();
    setItems(itemsRef.current);

    return () => {
      alive = false;
      visible = false;
      engineRef.current = null;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointerleave", onPointerLeave);
      container.removeEventListener("pointercancel", onPointerCancel);
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibility);
      slots.forEach((slot) => slot.dispose());
      slots = [];
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.parentNode?.removeChild(canvas);
    };
  }, []);

  const current = items[active] ?? items[0];

  return (
    <div
      ref={containerRef}
      className={`flex-carousel ${className}`.trim()}
      style={style}
      role="region"
      aria-roledescription="קרוסלה"
      aria-label={label}
      tabIndex={0}
    >
      <div className="flex-carousel__live" aria-live="polite" aria-atomic="true">
        {current ? `${current.title}, ${active + 1} מתוך ${items.length}` : ""}
      </div>
    </div>
  );
}
