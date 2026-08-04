"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { cn } from "@/lib/utils";

// Measured (not guessed) fractional bounding boxes of the actual lettering
// within each source asset's own frame — see the pixel-measurement notes
// in the project history. Both are relative to logo.png's OWN full frame
// (before the visual crop below): LOGO_MARK positions the flat wordmark
// within it, VIDEO_MARK positions the video against wherever that ends up.
const LOGO_MARK = { x0: 0.015, y0: 0.2129, x1: 0.9845, y1: 0.8026 };
const VIDEO_MARK = { x0: 0.0109, y0: 0.1936, x1: 0.9923, y1: 0.8298 };

// logo.png has a ~16% blank margin baked in above the lettering. The DOM
// slot the logo is measured against (see logoSlotRef) is sized to only the
// bottom 84% of the full image — these constants recover the full,
// undistorted image rect from that cropped slot: CROP_HEIGHT_SCALE grows
// the slot's height back out to the full image's height, CROP_TOP_SHIFT
// (a fraction of the SLOT's own height) says how far above the slot's own
// top the full image's top edge sits. Same numbers as the CSS crop this
// mirrors (see HeroSection): 1/0.84 and 0.16/0.84.
const CROP_HEIGHT_SCALE = 1.437962;
const CROP_TOP_SHIFT = 0.230074;

// Every fluid constant lives here, per the reference build's own advice —
// these are starting points, tuned for a wordmark of this rough size, not
// derived from a formula. SIM_RES/DYE_RES were bumped up when the canvas
// grew to span the whole Hero, but that made every frame noticeably
// heavier — with the dye/velocity FBOs now sampled with LINEAR filtering
// (see linearExt below) instead of NEAREST, the resolution bump was no
// longer buying much smoothness, just cost, and the extra per-frame cost
// was exactly what made the ink visibly lag behind a fast-moving cursor —
// so both are back down near their original values. CURL is 0 (no added
// vorticity confinement), but that alone doesn't stop a real fluid solve
// from spreading into thin trailing filaments — a pressure-projected
// velocity field stretches dye along its own flow lines even with zero
// confinement, which is what turned "ink fading" into "ink unraveling
// into wisps first, then fading." VELOCITY_DISSIPATION is pushed high and
// SPLAT_FORCE is kept low specifically to starve that stretching of the
// time/energy it needs — velocity collapses back to near-zero within a
// handful of frames of the cursor stopping, so the dye barely gets
// advected past its own splat shape before DENSITY_DISSIPATION takes
// over, reading as the ink pulling back into itself rather than spreading
// out and evaporating. DENSITY_DISSIPATION itself is slightly lower than
// the previous pass — that one faded a little too readily; this fades
// over roughly a second, still well short of lingering.
const CFG = {
  SIM_RES: 128,
  DYE_RES: 1024,
  PRESSURE_ITERATIONS: 20,
  PRESSURE: 0.8,
  CURL: 0,
  DENSITY_DISSIPATION: 2.1,
  VELOCITY_DISSIPATION: 10,
  SPLAT_RADIUS: 0.00075,
  SPLAT_FORCE: 120,
  SPLAT_SPACING: 0.006,
  MASK_LO: 0.09,
  MASK_HI: 0.31,
};

// The bottom-most INTERACTIVE_BOTTOM_MARGIN_PX of the wrapper stops
// registering new splats, purely so ink is never pinned hard against the
// wrapper's own bottom edge mid-motion — that edge is a clip, and driving
// fresh ink into it is what reads as the effect ending abruptly rather
// than settling. Nothing about the fluid sim's own extent changes here:
// the canvas still renders the whole area, and ink that drifts down keeps
// settling and smearing on its own all the way to the bottom.
//
// Kept deliberately narrow — just a hair below the CTA row's own bottom
// edge — so the ink stays live across the entire composition, the buttons
// included, and only the last few pixels before the hard edge are held
// back. It was 190px when the Hero ran a full viewport taller; at the
// current one-screen height that reached up into the wordmark itself and
// killed the interaction over the bottom of the logo.
const INTERACTIVE_BOTTOM_MARGIN_PX = 24;

const BASE_VERTEX_SHADER = `#version 300 es
precision highp float;
in vec2 aPosition;
out vec2 vUv;
out vec2 vL;
out vec2 vR;
out vec2 vT;
out vec2 vB;
uniform vec2 texelSize;
void main () {
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const SPLAT_SHADER = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
uniform sampler2D uTarget;
uniform float aspectRatio;
uniform vec3 color;
uniform vec2 point;
uniform float radius;
out vec4 fragColor;
void main () {
  vec2 p = vUv - point;
  p.x *= aspectRatio;
  vec3 splat = exp(-dot(p, p) / radius) * color;
  vec3 base = texture(uTarget, vUv).xyz;
  fragColor = vec4(base + splat, 1.0);
}`;

const ADVECTION_SHADER = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform float dt;
uniform float dissipation;
out vec4 fragColor;

vec4 bilerp(sampler2D sam, vec2 uv, vec2 tsize) {
  vec2 st = uv / tsize - 0.5;
  vec2 iuv = floor(st);
  vec2 fuv = fract(st);
  vec4 a = texture(sam, (iuv + vec2(0.5, 0.5)) * tsize);
  vec4 b = texture(sam, (iuv + vec2(1.5, 0.5)) * tsize);
  vec4 c = texture(sam, (iuv + vec2(0.5, 1.5)) * tsize);
  vec4 d = texture(sam, (iuv + vec2(1.5, 1.5)) * tsize);
  return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
}

void main () {
  vec2 vel = texture(uVelocity, vUv).xy;
  vec2 coord = vUv - dt * vel;
  vec4 result = bilerp(uSource, coord, texelSize);
  float decay = 1.0 + dissipation * dt;
  fragColor = result / decay;
}`;

const CURL_SHADER = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
uniform sampler2D uVelocity;
out vec4 fragColor;
void main () {
  float L = texture(uVelocity, vL).y;
  float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x;
  float B = texture(uVelocity, vB).x;
  float vorticity = R - L - T + B;
  fragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
}`;

const VORTICITY_SHADER = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float curl;
uniform float dt;
out vec4 fragColor;
void main () {
  float L = texture(uCurl, vL).x;
  float R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x;
  float B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  vec2 vel = texture(uVelocity, vUv).xy;
  vel += force * dt;
  fragColor = vec4(clamp(vel, -1000.0, 1000.0), 0.0, 1.0);
}`;

const DIVERGENCE_SHADER = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
uniform sampler2D uVelocity;
out vec4 fragColor;
void main () {
  float L = texture(uVelocity, vL).x;
  float R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y;
  float B = texture(uVelocity, vB).y;
  vec2 C = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0) L = -C.x;
  if (vR.x > 1.0) R = -C.x;
  if (vT.y > 1.0) T = -C.y;
  if (vB.y < 0.0) B = -C.y;
  float div = 0.5 * (R - L + T - B);
  fragColor = vec4(div, 0.0, 0.0, 1.0);
}`;

const PRESSURE_SHADER = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
out vec4 fragColor;
void main () {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  float divergence = texture(uDivergence, vUv).x;
  float pressure = (L + R + B + T - divergence) * 0.25;
  fragColor = vec4(pressure, 0.0, 0.0, 1.0);
}`;

const GRADIENT_SUBTRACT_SHADER = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
out vec4 fragColor;
void main () {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  vec2 velocity = texture(uVelocity, vUv).xy;
  velocity -= vec2(R - L, T - B);
  fragColor = vec4(velocity, 0.0, 1.0);
}`;

const CLEAR_SHADER = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
uniform sampler2D uTexture;
uniform float value;
out vec4 fragColor;
void main () {
  fragColor = value * texture(uTexture, vUv);
}`;

// The reveal itself: wherever dye density crosses the threshold band, alpha
// goes to 0 (transparent). Below the threshold, alpha stays 1 and the color
// is the paper texture (white page + the flat black wordmark + the tagline,
// drawn from logo.png and the DOM tagline's own metrics — not left as HTML;
// see the note on why that drawing has to happen on this canvas in
// FluidInkReveal below).
//
// Outside the tagline, a transparent pixel just lets whatever sits behind
// the canvas show through — the video within its own tight box, or the
// wrapper's own solid black background everywhere else (see the className
// below) — both black, so there's no seam where one ends and the other
// begins.
//
// Inside the tagline's own rect specifically, revealing doesn't show
// anything behind at all: erasing the SAME alpha there as everywhere else
// would erase the text and its background at the same rate, and since both
// reveal the identical black behind them, the letters would blend into the
// background exactly where the ink touches them — the opposite of
// legible. Instead the tagline always stays fully opaque, and reveals by
// inverting its own paper colors — paper*aOutside for the white background
// becomes black, and 1-paper for the black text becomes white, together,
// from the same source pixels, so contrast is guaranteed rather than
// incidental.
const DISPLAY_SHADER = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
uniform sampler2D uDye;
uniform sampler2D uPaper;
uniform float maskLo;
uniform float maskHi;
uniform vec4 taglineRect;
uniform vec4 ctaRect;
out vec4 fragColor;
void main () {
  float d = texture(uDye, vUv).r;
  float mask = smoothstep(maskLo, maskHi, d);
  vec3 paper = texture(uPaper, vUv).rgb;

  float inTagline = step(taglineRect.x, vUv.x) * step(vUv.x, taglineRect.z)
    * step(taglineRect.y, vUv.y) * step(vUv.y, taglineRect.w);

  // The CTAs invert exactly like the tagline does: inside this rect the ink
  // flips the paper instead of erasing it, so the black button reads white
  // under ink and the white one reads black. Without a region of its own a
  // painted button is simply wiped out, which is what the first attempt hit.
  float inCta = step(ctaRect.x, vUv.x) * step(vUv.x, ctaRect.z)
    * step(ctaRect.y, vUv.y) * step(vUv.y, ctaRect.w);

  float inInvert = max(inTagline, inCta);

  float aOutside = 1.0 - mask;
  vec3 colorOutside = paper * aOutside;

  vec3 colorInside = mix(paper, 1.0 - paper, mask);

  vec3 finalColor = mix(colorOutside, colorInside, inInvert);
  float finalAlpha = mix(aOutside, 1.0, inInvert);
  fragColor = vec4(finalColor, finalAlpha);
}`;

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${info}`);
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string) {
  const program = gl.createProgram()!;
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    throw new Error(`Program link error: ${info}`);
  }
  const uniforms: Record<string, WebGLUniformLocation> = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (!info) continue;
    const loc = gl.getUniformLocation(program, info.name);
    if (loc) uniforms[info.name] = loc;
  }
  return { program, uniforms };
}

interface FBO {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
}

interface DoubleFBO {
  read: FBO;
  write: FBO;
  swap: () => void;
}

export interface FluidInkRevealHandle {
  /** Whether the fluid sim actually mounted (false = fallback rendered instead). */
  isActive: () => boolean;
}

interface FluidInkRevealProps {
  logoSrc: string;
  videoSrc: string;
  /** Current (possibly mid-typewriter) tagline substring, drawn into the
   * same canvas as the wordmark so it can invert under the ink too. */
  taglineText: string;
  /** The (visually transparent, layout-only) DOM element the tagline's
   * real position/font/size is measured from — see HeroSection. */
  /** Omit to leave the line to ordinary DOM text — see the mobile hero. */
  taglineElRef?: React.RefObject<HTMLElement | null>;
  /** An invisible DOM spacer marking exactly where the (cropped) logo
   * should sit — see HeroSection. Measuring this instead of computing a
   * "how big should the logo be" formula is deliberate: a formula is
   * exactly what miscalculated the logo's size in an earlier pass. */
  logoSlotRef: React.RefObject<HTMLElement | null>;
  /** Hero CTAs painted onto the paper layer so the ink washes over them the
   * same way it does the wordmark. Their DOM elements stay real and
   * clickable but transparent; these are measured, never styled. */
  ctas?: CtaTarget[];
  className?: string;
}

export interface CtaTarget {
  ref: React.RefObject<HTMLElement | null>;
  labelRef: React.RefObject<HTMLElement | null>;
  arrowRef: React.RefObject<HTMLElement | null>;
  fill: string;
  textColor: string;
  borderColor?: string;
}

const FluidInkReveal = forwardRef<FluidInkRevealHandle, FluidInkRevealProps>(function FluidInkReveal(
  { logoSrc, videoSrc, taglineText, taglineElRef, logoSlotRef, ctas, className },
  ref
) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeRef = useRef(false);
  const redrawRef = useRef<(() => void) | null>(null);
  // Same escape hatch the tagline text uses: read through a ref so the
  // single long-lived effect below never needs these in its dep array.
  const ctasRef = useRef<CtaTarget[] | undefined>(ctas);
  ctasRef.current = ctas;
  // redrawPaper() is created once, inside the main effect below, which
  // deliberately does NOT re-run on every taglineText change (that would
  // mean tearing down and rebuilding the whole WebGL context per
  // keystroke). Reading the `taglineText` prop directly from there would
  // therefore always see the string from whenever that effect last ran —
  // stale on every subsequent keystroke. Keeping the latest value in a ref
  // that redrawPaper reads from each call sidesteps the closure entirely.
  const taglineTextRef = useRef(taglineText);
  taglineTextRef.current = taglineText;
  const prefersReducedMotion = usePrefersReducedMotion();

  useImperativeHandle(ref, () => ({
    isActive: () => activeRef.current,
  }));

  // Re-paints the paper texture whenever the typewriter advances — the
  // WebGL setup itself doesn't need to re-run for that, just a redraw.
  useEffect(() => {
    redrawRef.current?.();
  }, [taglineText]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!wrapper || !canvas || !video || prefersReducedMotion) return;

    let disposed = false;
    let rafId: number | null = null;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });

    // No WebGL2 at all — fall back to a plain CSS radial reveal instead of
    // the fluid sim, per the reference build's own tiered-fallback advice.
    if (!gl) {
      console.warn("[FluidInkReveal] WebGL2 unavailable, using CSS fallback");
      wrapper.classList.add("fluid-fallback");
      return;
    }

    const floatExt = gl.getExtension("EXT_color_buffer_float");
    if (!floatExt) {
      console.warn("[FluidInkReveal] EXT_color_buffer_float unavailable, using CSS fallback");
      wrapper.classList.add("fluid-fallback");
      return;
    }

    // Half-float textures need this extension specifically to be sampled
    // with bilinear filtering — without it (or on a driver that lacks it)
    // every FBO below falls back to NEAREST, which reads as visible hard
    // square blocks in the dye field once the canvas is stretched over an
    // area much bigger than DYE_RES was tuned for (the whole Hero now,
    // not just the tight logo box).
    const linearExt = gl.getExtension("OES_texture_float_linear");
    const fboFilter = linearExt ? gl.LINEAR : gl.NEAREST;

    const supportsRenderTextureFormat = (internalFormat: number, format: number, type: number) => {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      gl.deleteFramebuffer(fbo);
      gl.deleteTexture(texture);
      return status === gl.FRAMEBUFFER_COMPLETE;
    };

    // Narrows R16F -> RG16F -> RGBA16F until the driver accepts one, per
    // the reference build's 4x4-probe approach — some drivers reject the
    // single/dual-channel float formats outright.
    const getSupportedFormat = (
      internalFormat: number,
      format: number,
      type: number
    ): { internalFormat: number; format: number } | null => {
      if (supportsRenderTextureFormat(internalFormat, format, type)) return { internalFormat, format };
      if (internalFormat === gl.R16F) return getSupportedFormat(gl.RG16F, gl.RG, type);
      if (internalFormat === gl.RG16F) return getSupportedFormat(gl.RGBA16F, gl.RGBA, type);
      return null;
    };

    const halfFloat = gl.HALF_FLOAT;
    const rFormat = getSupportedFormat(gl.R16F, gl.RED, halfFloat);
    const rgFormat = getSupportedFormat(gl.RG16F, gl.RG, halfFloat);
    const rgbaFormat = getSupportedFormat(gl.RGBA16F, gl.RGBA, halfFloat);

    if (!rFormat || !rgFormat || !rgbaFormat) {
      console.warn("[FluidInkReveal] no renderable float format found, using CSS fallback");
      wrapper.classList.add("fluid-fallback");
      return;
    }

    activeRef.current = true;

    // ---- fullscreen quad ----
    const quadVAO = gl.createVertexArray();
    gl.bindVertexArray(quadVAO);
    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, -1, -1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    const drawQuad = () => {
      gl.bindVertexArray(quadVAO);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.bindVertexArray(null);
    };

    // ---- programs ----
    const splatProgram = createProgram(gl, BASE_VERTEX_SHADER, SPLAT_SHADER);
    const advectionProgram = createProgram(gl, BASE_VERTEX_SHADER, ADVECTION_SHADER);
    const curlProgram = createProgram(gl, BASE_VERTEX_SHADER, CURL_SHADER);
    const vorticityProgram = createProgram(gl, BASE_VERTEX_SHADER, VORTICITY_SHADER);
    const divergenceProgram = createProgram(gl, BASE_VERTEX_SHADER, DIVERGENCE_SHADER);
    const pressureProgram = createProgram(gl, BASE_VERTEX_SHADER, PRESSURE_SHADER);
    const gradientSubtractProgram = createProgram(gl, BASE_VERTEX_SHADER, GRADIENT_SUBTRACT_SHADER);
    const clearProgram = createProgram(gl, BASE_VERTEX_SHADER, CLEAR_SHADER);
    const displayProgram = createProgram(gl, BASE_VERTEX_SHADER, DISPLAY_SHADER);

    // ---- FBOs ----
    const createFBO = (w: number, h: number, internalFormat: number, format: number, type: number): FBO => {
      gl.activeTexture(gl.TEXTURE0);
      const texture = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, fboFilter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, fboFilter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

      const fbo = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      gl.viewport(0, 0, w, h);
      gl.clear(gl.COLOR_BUFFER_BIT);

      return { texture, fbo, width: w, height: h, texelSizeX: 1 / w, texelSizeY: 1 / h };
    };

    const createDoubleFBO = (w: number, h: number, internalFormat: number, format: number, type: number): DoubleFBO => {
      let fbo1 = createFBO(w, h, internalFormat, format, type);
      let fbo2 = createFBO(w, h, internalFormat, format, type);
      return {
        get read() {
          return fbo1;
        },
        get write() {
          return fbo2;
        },
        swap() {
          const tmp = fbo1;
          fbo1 = fbo2;
          fbo2 = tmp;
        },
      };
    };

    let simWidth = 0;
    let simHeight = 0;
    let dyeWidth = 0;
    let dyeHeight = 0;
    let velocity: DoubleFBO;
    let dye: DoubleFBO;
    let pressure: DoubleFBO;
    let divergenceFBO: FBO;
    let curlFBO: FBO;

    const buildSimTargets = () => {
      const rect = wrapper.getBoundingClientRect();
      const aspect = rect.width / Math.max(rect.height, 1);
      simHeight = CFG.SIM_RES;
      simWidth = Math.round(CFG.SIM_RES * Math.max(aspect, 1));
      if (aspect < 1) {
        simWidth = CFG.SIM_RES;
        simHeight = Math.round(CFG.SIM_RES / Math.max(aspect, 0.01));
      }
      dyeHeight = CFG.DYE_RES;
      dyeWidth = Math.round(CFG.DYE_RES * Math.max(aspect, 1));
      if (aspect < 1) {
        dyeWidth = CFG.DYE_RES;
        dyeHeight = Math.round(CFG.DYE_RES / Math.max(aspect, 0.01));
      }

      velocity = createDoubleFBO(simWidth, simHeight, rgFormat.internalFormat, rgFormat.format, halfFloat);
      dye = createDoubleFBO(dyeWidth, dyeHeight, rgbaFormat.internalFormat, rgbaFormat.format, halfFloat);
      pressure = createDoubleFBO(simWidth, simHeight, rFormat.internalFormat, rFormat.format, halfFloat);
      divergenceFBO = createFBO(simWidth, simHeight, rFormat.internalFormat, rFormat.format, halfFloat);
      curlFBO = createFBO(simWidth, simHeight, rFormat.internalFormat, rFormat.format, halfFloat);
    };

    buildSimTargets();

    // ---- paper texture (the white page + flat black wordmark + tagline,
    // drawn from logo.png and the DOM tagline's own metrics — not left as
    // HTML, so both can be erased/inverted by the sim's own alpha output;
    // see DISPLAY_SHADER). A live 2D canvas is used purely as a pixel
    // source to upload from, never itself displayed. ----
    const paperCanvas = document.createElement("canvas");
    const paperCtx = paperCanvas.getContext("2d")!;
    const paperTexture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, paperTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // The current text bounding box in wrapper-local CSS pixels — recomputed
    // whenever the paper texture is redrawn, and what both the video's CSS
    // placement and the tagline-invert shader uniform key off.
    let textRect = { left: 0, top: 0, width: 0, height: 0 };
    let taglineRectUv = [0, 0, 0, 0];
    let ctaRectUv = [0, 0, 0, 0];
    let logoImage: HTMLImageElement | null = null;
    // Reused across frames; recreating it every paint would thrash allocation.
    let logoTintCanvas: HTMLCanvasElement | null = null;

    // How much of the wrapper's own height the (uncropped) logo image
    // occupies — CFG.SPLAT_RADIUS was tuned back when the wrapper WAS that
    // image's own tight box (ratio 1). Now the wrapper spans the whole
    // interactive area and the logo is a small part of it, so scaling the
    // radius by this ratio keeps the ink sized to the lettering instead of
    // a fixed fraction of the much bigger canvas.
    let splatRadiusScale = 1;

    const redrawPaper = () => {
      const rect = wrapper.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      paperCanvas.width = w;
      paperCanvas.height = h;

      paperCtx.fillStyle = "#ffffff";
      paperCtx.fillRect(0, 0, w, h);

      // Tagline — drawn from the live DOM element's own measured position
      // and computed font, matching what would have rendered there as
      // ordinary text (which is now visually transparent — see
      // HeroSection).
      const taglineEl = taglineElRef?.current ?? null;
      const currentTaglineText = taglineTextRef.current;
      if (taglineEl) {
        const tRect = taglineEl.getBoundingClientRect();
        const relLeft = (tRect.left - rect.left) * dpr;
        const relTop = (tRect.top - rect.top) * dpr;
        const relWidth = tRect.width * dpr;
        const relHeight = tRect.height * dpr;

        if (currentTaglineText && relWidth > 0 && relHeight > 0) {
          const style = getComputedStyle(taglineEl);
          const fontSize = parseFloat(style.fontSize) * dpr;
          paperCtx.font = `${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
          paperCtx.fillStyle = "#000000";
          paperCtx.direction = "rtl";
          paperCtx.textAlign = "right";
          paperCtx.textBaseline = "middle";
          paperCtx.fillText(currentTaglineText, relLeft + relWidth, relTop + relHeight / 2);
        }

        taglineRectUv = [relLeft / w, 1 - (relTop + relHeight) / h, (relLeft + relWidth) / w, 1 - relTop / h];
      }

      // Logo — measured from the invisible logoSlot spacer (its exact
      // visual position/size, matching the reduced-motion branch's own CSS
      // crop pixel-for-pixel), not computed from a "how big should this be"
      // formula.
      const logoSlotEl = logoSlotRef.current;
      if (logoSlotEl && rect.height > 0) {
        const lRect = logoSlotEl.getBoundingClientRect();
        const slotRect = {
          left: lRect.left - rect.left,
          top: lRect.top - rect.top,
          width: lRect.width,
          height: lRect.height,
        };

        // The slot is the CROPPED (post-margin) view; recover the full,
        // undistorted image rect so drawImage doesn't stretch the artwork.
        const fullRect = {
          left: slotRect.left,
          top: slotRect.top - slotRect.height * CROP_TOP_SHIFT,
          width: slotRect.width,
          height: slotRect.height * CROP_HEIGHT_SCALE,
        };

        if (logoImage && fullRect.width > 0) {
          // logo.png's opaque pixels are WHITE (a solid-fill wordmark on
          // transparent, not baked black), so it has to be recoloured to black
          // before it goes on the paper.
          //
          // This used to be `paperCtx.filter = "brightness(0)"`, which mobile
          // Safari silently ignores — canvas filter support landed late there
          // and is still unreliable. When it is ignored the wordmark paints in
          // its own white, onto white paper, and all that survives is a faint
          // edge that reads as a frame around nothing. That is exactly the
          // reported symptom, and it only showed on a real device because
          // desktop Chrome honours the filter.
          //
          // A source-in composite does the same recolour with no filter
          // support required: draw the artwork, then flood the canvas with
          // black keeping only the pixels the artwork already covers.
          const lw = Math.max(1, Math.round(fullRect.width * dpr));
          const lh = Math.max(1, Math.round(fullRect.height * dpr));
          const tint = logoTintCanvas ?? (logoTintCanvas = document.createElement("canvas"));
          if (tint.width !== lw || tint.height !== lh) {
            tint.width = lw;
            tint.height = lh;
          }
          const tintCtx = tint.getContext("2d");
          if (tintCtx) {
            tintCtx.clearRect(0, 0, lw, lh);
            tintCtx.globalCompositeOperation = "source-over";
            tintCtx.drawImage(logoImage, 0, 0, lw, lh);
            tintCtx.globalCompositeOperation = "source-in";
            tintCtx.fillStyle = "#000000";
            tintCtx.fillRect(0, 0, lw, lh);
            tintCtx.globalCompositeOperation = "source-over";
            paperCtx.drawImage(tint, fullRect.left * dpr, fullRect.top * dpr, lw, lh);
          }
        }

        textRect = {
          left: fullRect.left + LOGO_MARK.x0 * fullRect.width,
          top: fullRect.top + LOGO_MARK.y0 * fullRect.height,
          width: (LOGO_MARK.x1 - LOGO_MARK.x0) * fullRect.width,
          height: (LOGO_MARK.y1 - LOGO_MARK.y0) * fullRect.height,
        };

        splatRadiusScale = fullRect.height / rect.height;
      }

      // CTAs — painted straight onto the paper layer, measured from their
      // own (transparent) DOM boxes so the canvas copy lands exactly where
      // the real, clickable link already is.
      const currentCtas = ctasRef.current;
      // Union of both buttons, in the same UV space the tagline rect uses,
      // padded slightly so the inversion covers their outer edge rather than
      // cutting exactly at it. Reset first so a hidden/absent row can never
      // leave a stale region inverting empty page.
      ctaRectUv = [0, 0, 0, 0];
      if (currentCtas && currentCtas.length) {
        let minL = Infinity, minT = Infinity, maxR = -Infinity, maxB = -Infinity;
        currentCtas.forEach((cta) => {
          const el = cta.ref.current;
          if (!el) return;
          const r = el.getBoundingClientRect();
          if (r.width <= 0 || r.height <= 0) return;
          minL = Math.min(minL, r.left - rect.left);
          minT = Math.min(minT, r.top - rect.top);
          maxR = Math.max(maxR, r.right - rect.left);
          maxB = Math.max(maxB, r.bottom - rect.top);
        });
        if (minL < Infinity) {
          const pad = 3;
          const l = (minL - pad) * dpr;
          const t = (minT - pad) * dpr;
          const r2 = (maxR + pad) * dpr;
          const b2 = (maxB + pad) * dpr;
          // y is flipped: the paper texture is uploaded with UNPACK_FLIP_Y.
          ctaRectUv = [l / w, 1 - b2 / h, r2 / w, 1 - t / h];
        }
      }
      if (currentCtas) {
        currentCtas.forEach((cta) => {
          const el = cta.ref.current;
          if (!el) return;
          const bRect = el.getBoundingClientRect();
          if (bRect.width <= 0 || bRect.height <= 0) return;
          const bx = (bRect.left - rect.left) * dpr;
          const by = (bRect.top - rect.top) * dpr;
          const bw = bRect.width * dpr;
          const bh = bRect.height * dpr;
          const radius = 8 * dpr; // matches rounded-lg

          paperCtx.beginPath();
          if (typeof paperCtx.roundRect === "function") {
            paperCtx.roundRect(bx, by, bw, bh, radius);
          } else {
            paperCtx.rect(bx, by, bw, bh);
          }
          paperCtx.fillStyle = cta.fill;
          paperCtx.fill();
          if (cta.borderColor) {
            paperCtx.lineWidth = Math.max(1, dpr);
            paperCtx.strokeStyle = cta.borderColor;
            paperCtx.stroke();
          }

          const labelEl = cta.labelRef.current;
          if (labelEl) {
            const lRect = labelEl.getBoundingClientRect();
            const lStyle = getComputedStyle(labelEl);
            paperCtx.font = `${lStyle.fontWeight} ${parseFloat(lStyle.fontSize) * dpr}px ${lStyle.fontFamily}`;
            paperCtx.fillStyle = cta.textColor;
            paperCtx.textAlign = "center";
            paperCtx.textBaseline = "middle";
            paperCtx.direction = "rtl";
            paperCtx.fillText(
              labelEl.textContent ?? "",
              (lRect.left + lRect.width / 2 - rect.left) * dpr,
              (lRect.top + lRect.height / 2 - rect.top) * dpr
            );
          }

          const arrowEl = cta.arrowRef.current;
          if (arrowEl) {
            const aRect = arrowEl.getBoundingClientRect();
            const ax = (aRect.left - rect.left) * dpr;
            const ay = (aRect.top - rect.top) * dpr;
            const size = aRect.width * dpr;
            const u = size / 14; // the icon's own 14x14 viewBox
            paperCtx.beginPath();
            paperCtx.moveTo(ax + 11.5 * u, ay + 7 * u);
            paperCtx.lineTo(ax + 2.5 * u, ay + 7 * u);
            paperCtx.moveTo(ax + 6.5 * u, ay + 3 * u);
            paperCtx.lineTo(ax + 2.5 * u, ay + 7 * u);
            paperCtx.lineTo(ax + 6.5 * u, ay + 11 * u);
            paperCtx.strokeStyle = cta.textColor;
            paperCtx.lineWidth = 1.5 * u;
            paperCtx.lineCap = "round";
            paperCtx.lineJoin = "round";
            paperCtx.stroke();
          }
        });
      }
      gl.bindTexture(gl.TEXTURE_2D, paperTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, paperCanvas);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

      positionVideo();
    };

    redrawRef.current = redrawPaper;

    // Video registration: matched on WIDTH (see the note in HeroSection's
    // history) — the rendered 3D letters are chunkier than the flat
    // logo.png outline, and that mismatch is the whole point of the
    // effect, not something to correct with a non-uniform scale.
    const positionVideo = () => {
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh || textRect.width === 0) return;
      const dispW = textRect.width / (VIDEO_MARK.x1 - VIDEO_MARK.x0);
      const dispH = dispW * (vh / vw);
      const left = textRect.left - VIDEO_MARK.x0 * dispW;
      const top = textRect.top + textRect.height / 2 - ((VIDEO_MARK.y0 + VIDEO_MARK.y1) / 2) * dispH;
      video.style.width = `${dispW}px`;
      video.style.height = `${dispH}px`;
      video.style.left = `${left}px`;
      video.style.top = `${top}px`;
      // Only reveal once it's actually been sized/positioned — see the
      // matching opacity:0 on the element's own initial style below for
      // why this is needed at all.
      video.style.opacity = "1";
    };

    const img = new Image();
    img.onload = () => {
      if (disposed) return;
      logoImage = img;
      redrawPaper();
    };
    img.src = logoSrc;

    const handleVideoMeta = () => positionVideo();
    video.addEventListener("loadedmetadata", handleVideoMeta);
    const attemptPlay = () => video.play().catch(() => {});
    attemptPlay();
    video.addEventListener("canplay", attemptPlay);
    const handleVisibility = () => {
      if (!document.hidden) attemptPlay();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    const handleFirstPointerDown = () => attemptPlay();
    wrapper.addEventListener("pointerdown", handleFirstPointerDown);

    // ---- pointer / splat state ----
    let lastPointer = { x: 0.5, y: 0.5, has: false };

    const toUv = (clientX: number, clientY: number) => {
      const rect = wrapper.getBoundingClientRect();
      return {
        x: (clientX - rect.left) / rect.width,
        y: 1 - (clientY - rect.top) / rect.height,
      };
    };

    const splat = (x: number, y: number, dx: number, dy: number) => {
      const rect = wrapper.getBoundingClientRect();
      const aspect = rect.width / Math.max(rect.height, 1);

      gl.viewport(0, 0, velocity.write.width, velocity.write.height);
      gl.useProgram(splatProgram.program);
      gl.bindFramebuffer(gl.FRAMEBUFFER, velocity.write.fbo);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
      gl.uniform1i(splatProgram.uniforms.uTarget, 0);
      gl.uniform1f(splatProgram.uniforms.aspectRatio, aspect);
      gl.uniform2f(splatProgram.uniforms.point, x, y);
      gl.uniform3f(splatProgram.uniforms.color, dx * CFG.SPLAT_FORCE, dy * CFG.SPLAT_FORCE, 0);
      gl.uniform1f(splatProgram.uniforms.radius, CFG.SPLAT_RADIUS * splatRadiusScale);
      drawQuad();
      velocity.swap();

      gl.viewport(0, 0, dye.write.width, dye.write.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, dye.write.fbo);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, dye.read.texture);
      gl.uniform1i(splatProgram.uniforms.uTarget, 0);
      gl.uniform3f(splatProgram.uniforms.color, 1, 1, 1);
      drawQuad();
      dye.swap();
    };

    // Interpolates along the stroke, not just at raw pointermove events —
    // without this a fast flick lands as a row of separate dots, since
    // pointermove fires roughly once per frame and a quick flick can cover
    // a hundred+ pixels between two consecutive events. CFG.SPLAT_SPACING
    // is tuned in UV units for a canvas the size of the (tight) logo box;
    // now that the wrapper spans the whole Hero, the same real on-screen
    // drag distance maps to a much smaller UV delta, so the raw constant
    // alone would under-count steps and leave the stroke visibly gappy —
    // scaled by splatRadiusScale (same ratio the splat radius itself uses)
    // to keep the same effective on-screen spacing regardless of how big
    // the canvas has grown.
    const splatAlongStroke = (fromX: number, fromY: number, toX: number, toY: number) => {
      const dx = toX - fromX;
      const dy = toY - fromY;
      const dist = Math.hypot(dx, dy);
      const steps = Math.max(1, Math.ceil(dist / (CFG.SPLAT_SPACING * splatRadiusScale)));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const x = fromX + dx * t;
        const y = fromY + dy * t;
        splat(x, y, dx / steps, dy / steps);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = wrapper.getBoundingClientRect();
      if (e.clientY > rect.bottom - INTERACTIVE_BOTTOM_MARGIN_PX) {
        // Same handling as the pointer actually leaving — see
        // INTERACTIVE_BOTTOM_MARGIN_PX's own comment. Re-entering the
        // reactive area above starts a fresh stroke instead of connecting
        // a line down through here once the pointer comes back up.
        lastPointer.has = false;
        return;
      }
      const { x, y } = toUv(e.clientX, e.clientY);
      if (lastPointer.has) {
        splatAlongStroke(lastPointer.x, lastPointer.y, x, y);
      }
      lastPointer = { x, y, has: true };
    };
    const handlePointerLeave = () => {
      lastPointer.has = false;
    };

    // Touch is driven off touch events, not pointer events, and the page keeps
    // its own scrolling.
    //
    // The browser cancels the POINTER stream the moment it decides a drag is a
    // scroll — which is why the ink lit up on first contact and then went dead.
    // touchmove is not cancelled that way: it keeps firing for the whole drag,
    // scrolling or not. So the ink can follow the finger without the page
    // having to give up the gesture, and touch-action stays out of it
    // entirely — no trapping the reader on a full-screen hero.
    //
    // Passive on purpose: these never preventDefault, so telling the browser
    // that up front keeps scrolling off the main thread.
    const handleTouch = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      const rect = wrapper.getBoundingClientRect();
      if (touch.clientY > rect.bottom - INTERACTIVE_BOTTOM_MARGIN_PX) {
        lastPointer.has = false;
        return;
      }
      const { x, y } = toUv(touch.clientX, touch.clientY);
      if (lastPointer.has) {
        splatAlongStroke(lastPointer.x, lastPointer.y, x, y);
      }
      lastPointer = { x, y, has: true };
    };
    const handleTouchEnd = () => {
      lastPointer.has = false;
    };

    // Listen on the whole Hero section, not just the canvas wrapper. The
    // CTA buttons and contact icons are siblings of the wrapper, not
    // descendants, and they carry pointer-events-auto so they stay
    // clickable — which meant a pointer over them never reached the
    // wrapper at all and the ink went dead exactly there. The section is
    // the common ancestor of both, and the handler works in absolute
    // client coordinates anyway, so moving the listener up makes the ink
    // live across the entire composition without touching the sim or
    // costing the buttons their own interactivity.
    //
    // touch-action: pan-y, not none.
    //
    // The browser has to decide, on the first few pixels of a drag, whether it
    // is a scroll or something the page wants. Left at its default it claims
    // every direction, so drawing on the ink dragged the page around at the
    // same time. `none` would hand every gesture to the canvas — the ink would
    // be perfectly still, but the hero fills the screen, so there would be
    // nowhere left to swipe to leave it. `pan-y` splits it: vertical drags
    // still scroll the page, and everything else goes to the ink and moves
    // nothing.
    const interactionTarget: HTMLElement = wrapper.closest("section") ?? wrapper;
    interactionTarget.addEventListener("pointermove", handlePointerMove);
    interactionTarget.addEventListener("pointerleave", handlePointerLeave);
    interactionTarget.addEventListener("pointercancel", handlePointerLeave);
    interactionTarget.addEventListener("touchstart", handleTouch, { passive: true });
    interactionTarget.addEventListener("touchmove", handleTouch, { passive: true });
    interactionTarget.addEventListener("touchend", handleTouchEnd, { passive: true });
    interactionTarget.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    // ---- resize ----
    const resize = () => {
      const rect = wrapper.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const nextW = Math.round(rect.width * dpr);
      const nextH = Math.round(rect.height * dpr);
      // Rebuilding the sim clears it, which reads as a white flash with the
      // clip showing through. A ResizeObserver fires for plenty of things that
      // do not actually change the pixel size, so only pay that cost when the
      // buffer really has to change.
      if (canvas.width === nextW && canvas.height === nextH) return;
      canvas.width = nextW;
      canvas.height = nextH;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
      buildSimTargets();
      redrawPaper();
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(wrapper);
    window.addEventListener("orientationchange", resize);

    // ---- render loop ----
    let lastTime = performance.now();

    // Purely reactive to the pointer — nothing here moves or splats on its
    // own. At rest the canvas is just the flat page + wordmark, exactly
    // like a plain static image.
    const step = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 1 / 30);
      lastTime = now;

      gl.disable(gl.BLEND);

      // curl
      gl.viewport(0, 0, simWidth, simHeight);
      gl.useProgram(curlProgram.program);
      gl.uniform2f(curlProgram.uniforms.texelSize, velocity.read.texelSizeX, velocity.read.texelSizeY);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
      gl.uniform1i(curlProgram.uniforms.uVelocity, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, curlFBO.fbo);
      drawQuad();

      // vorticity confinement
      gl.useProgram(vorticityProgram.program);
      gl.uniform2f(vorticityProgram.uniforms.texelSize, velocity.read.texelSizeX, velocity.read.texelSizeY);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
      gl.uniform1i(vorticityProgram.uniforms.uVelocity, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, curlFBO.texture);
      gl.uniform1i(vorticityProgram.uniforms.uCurl, 1);
      gl.uniform1f(vorticityProgram.uniforms.curl, CFG.CURL);
      gl.uniform1f(vorticityProgram.uniforms.dt, dt);
      gl.bindFramebuffer(gl.FRAMEBUFFER, velocity.write.fbo);
      drawQuad();
      velocity.swap();

      // divergence
      gl.useProgram(divergenceProgram.program);
      gl.uniform2f(divergenceProgram.uniforms.texelSize, velocity.read.texelSizeX, velocity.read.texelSizeY);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
      gl.uniform1i(divergenceProgram.uniforms.uVelocity, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, divergenceFBO.fbo);
      drawQuad();

      // pressure clear (dissipate previous pressure before solving again)
      gl.useProgram(clearProgram.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, pressure.read.texture);
      gl.uniform1i(clearProgram.uniforms.uTexture, 0);
      gl.uniform1f(clearProgram.uniforms.value, CFG.PRESSURE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, pressure.write.fbo);
      drawQuad();
      pressure.swap();

      // pressure (Jacobi)
      gl.useProgram(pressureProgram.program);
      gl.uniform2f(pressureProgram.uniforms.texelSize, velocity.read.texelSizeX, velocity.read.texelSizeY);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, divergenceFBO.texture);
      gl.uniform1i(pressureProgram.uniforms.uDivergence, 0);
      for (let i = 0; i < CFG.PRESSURE_ITERATIONS; i++) {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, pressure.read.texture);
        gl.uniform1i(pressureProgram.uniforms.uPressure, 1);
        gl.bindFramebuffer(gl.FRAMEBUFFER, pressure.write.fbo);
        drawQuad();
        pressure.swap();
      }

      // subtract pressure gradient
      gl.useProgram(gradientSubtractProgram.program);
      gl.uniform2f(gradientSubtractProgram.uniforms.texelSize, velocity.read.texelSizeX, velocity.read.texelSizeY);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, pressure.read.texture);
      gl.uniform1i(gradientSubtractProgram.uniforms.uPressure, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
      gl.uniform1i(gradientSubtractProgram.uniforms.uVelocity, 1);
      gl.bindFramebuffer(gl.FRAMEBUFFER, velocity.write.fbo);
      drawQuad();
      velocity.swap();

      // advect velocity (self-advection)
      gl.useProgram(advectionProgram.program);
      gl.uniform2f(advectionProgram.uniforms.texelSize, velocity.read.texelSizeX, velocity.read.texelSizeY);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
      gl.uniform1i(advectionProgram.uniforms.uVelocity, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
      gl.uniform1i(advectionProgram.uniforms.uSource, 1);
      gl.uniform1f(advectionProgram.uniforms.dt, dt);
      gl.uniform1f(advectionProgram.uniforms.dissipation, CFG.VELOCITY_DISSIPATION);
      gl.bindFramebuffer(gl.FRAMEBUFFER, velocity.write.fbo);
      drawQuad();
      velocity.swap();

      // advect dye
      gl.viewport(0, 0, dyeWidth, dyeHeight);
      gl.uniform2f(advectionProgram.uniforms.texelSize, dye.read.texelSizeX, dye.read.texelSizeY);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
      gl.uniform1i(advectionProgram.uniforms.uVelocity, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, dye.read.texture);
      gl.uniform1i(advectionProgram.uniforms.uSource, 1);
      gl.uniform1f(advectionProgram.uniforms.dissipation, CFG.DENSITY_DISSIPATION);
      gl.bindFramebuffer(gl.FRAMEBUFFER, dye.write.fbo);
      drawQuad();
      dye.swap();

      // display
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(displayProgram.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, dye.read.texture);
      gl.uniform1i(displayProgram.uniforms.uDye, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, paperTexture);
      gl.uniform1i(displayProgram.uniforms.uPaper, 1);
      gl.uniform1f(displayProgram.uniforms.maskLo, CFG.MASK_LO);
      gl.uniform1f(displayProgram.uniforms.maskHi, CFG.MASK_HI);
      gl.uniform4f(displayProgram.uniforms.taglineRect, taglineRectUv[0], taglineRectUv[1], taglineRectUv[2], taglineRectUv[3]);
      gl.uniform4f(displayProgram.uniforms.ctaRect, ctaRectUv[0], ctaRectUv[1], ctaRectUv[2], ctaRectUv[3]);
      drawQuad();

      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);

    return () => {
      disposed = true;
      redrawRef.current = null;
      if (rafId !== null) cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener("orientationchange", resize);
      interactionTarget.removeEventListener("touchstart", handleTouch);
      interactionTarget.removeEventListener("touchmove", handleTouch);
      interactionTarget.removeEventListener("touchend", handleTouchEnd);
      interactionTarget.removeEventListener("touchcancel", handleTouchEnd);
      interactionTarget.removeEventListener("pointermove", handlePointerMove);
      interactionTarget.removeEventListener("pointerleave", handlePointerLeave);
      interactionTarget.removeEventListener("pointercancel", handlePointerLeave);
      wrapper.removeEventListener("pointerdown", handleFirstPointerDown);
      video.removeEventListener("loadedmetadata", handleVideoMeta);
      video.removeEventListener("canplay", attemptPlay);
      document.removeEventListener("visibilitychange", handleVisibility);
      video.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoSrc, videoSrc, prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <div ref={wrapperRef} className={cn("bg-black", className)} style={{ position: "relative" }}>
      <video
        ref={videoRef}
        aria-hidden="true"
        tabIndex={-1}
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        // No width/height/left/top until positionVideo() computes them
        // from the (async-loaded) logo image's own textRect — until then
        // this is an absolutely positioned element with no explicit size,
        // which the browser renders at its native intrinsic video
        // dimensions pinned to the wrapper's top-left corner. Left
        // visible, that's a real, reproducible flash of a huge unstyled
        // video before the layout settles. opacity stays 0 until
        // positionVideo() explicitly sets it to 1.
        style={{ position: "absolute", objectFit: "cover", opacity: 0 }}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
      <canvas ref={canvasRef} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", touchAction: "pan-y" }} />
    </div>
  );
});

export default FluidInkReveal;
