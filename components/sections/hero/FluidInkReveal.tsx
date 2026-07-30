"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";

// Measured (not guessed) fractional bounding boxes of the actual lettering
// within each source asset's own frame — see the pixel-measurement notes
// in the project history. logo.png's own margins/proportions were built to
// roughly match the video's, but not identically, so both are kept and
// used independently: LOGO_MARK positions the flat wordmark within this
// canvas, VIDEO_MARK positions the video against wherever that ends up.
const LOGO_MARK = { x0: 0.015, y0: 0.2129, x1: 0.9845, y1: 0.8026 };
const VIDEO_MARK = { x0: 0.0109, y0: 0.1936, x1: 0.9923, y1: 0.8298 };

// Every fluid constant lives here, per the reference build's own advice —
// these are starting points, tuned for a wordmark of this rough size, not
// derived from a formula.
const CFG = {
  SIM_RES: 128,
  DYE_RES: 1024,
  PRESSURE_ITERATIONS: 20,
  PRESSURE: 0.8,
  CURL: 22,
  DENSITY_DISSIPATION: 2.1,
  VELOCITY_DISSIPATION: 1.4,
  SPLAT_RADIUS: 0.0017,
  SPLAT_FORCE: 2600,
  SPLAT_SPACING: 0.006,
  MASK_LO: 0.1,
  MASK_HI: 0.34,
  IDLE_DELAY: 2.6, // seconds of no input before the idle drift kicks in
};

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
// goes to 0 (transparent — the video shows through). Below the threshold,
// alpha stays 1 and the color is the paper texture (white page + the flat
// black wordmark, drawn from logo.png, not HTML) — see the note on why
// that drawing has to happen on this canvas in FluidInkReveal below.
const DISPLAY_SHADER = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
uniform sampler2D uDye;
uniform sampler2D uPaper;
uniform float maskLo;
uniform float maskHi;
out vec4 fragColor;
void main () {
  float d = texture(uDye, vUv).r;
  float mask = smoothstep(maskLo, maskHi, d);
  float a = 1.0 - mask;
  vec3 paper = texture(uPaper, vUv).rgb;
  fragColor = vec4(paper * a, a);
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
  className?: string;
}

const FluidInkReveal = forwardRef<FluidInkRevealHandle, FluidInkRevealProps>(function FluidInkReveal(
  { logoSrc, videoSrc, className },
  ref
) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeRef = useRef(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useImperativeHandle(ref, () => ({
    isActive: () => activeRef.current,
  }));

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
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
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

    // ---- paper texture (the white page + flat black wordmark, drawn from
    // logo.png — not HTML, so it can be erased by the sim's own alpha
    // output; see DISPLAY_SHADER). A live 2D canvas is used purely as a
    // pixel source to upload from, never itself displayed. ----
    const paperCanvas = document.createElement("canvas");
    const paperCtx = paperCanvas.getContext("2d")!;
    const paperTexture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, paperTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // The current text bounding box in wrapper-local CSS pixels — recomputed
    // whenever the paper texture is redrawn, and what both the fullscreen
    // fluid math (aspect ratio) and the video's own CSS placement key off.
    let textRect = { left: 0, top: 0, width: 0, height: 0 };
    let logoImage: HTMLImageElement | null = null;

    const redrawPaper = () => {
      const rect = wrapper.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      paperCanvas.width = w;
      paperCanvas.height = h;

      paperCtx.fillStyle = "#ffffff";
      paperCtx.fillRect(0, 0, w, h);

      if (logoImage) {
        // The logo is drawn to fill the canvas exactly — the wrapper's own
        // box is aspect-locked to logo.png's real aspect ratio (see the
        // className below), so this never distorts or letterboxes.
        // logo.png's opaque pixels are white (a solid-fill wordmark on
        // transparent, not baked black) — brightness(0) recolors them to
        // black without touching alpha, the same trick the old <Image>
        // used via a CSS filter.
        paperCtx.filter = "brightness(0)";
        paperCtx.drawImage(logoImage, 0, 0, w, h);
        paperCtx.filter = "none";
      }

      gl.bindTexture(gl.TEXTURE_2D, paperTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, paperCanvas);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

      textRect = {
        left: LOGO_MARK.x0 * rect.width,
        top: LOGO_MARK.y0 * rect.height,
        width: (LOGO_MARK.x1 - LOGO_MARK.x0) * rect.width,
        height: (LOGO_MARK.y1 - LOGO_MARK.y0) * rect.height,
      };

      positionVideo();
    };

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
    let lastInputTime = performance.now();
    let idleAngle = Math.random() * Math.PI * 2;

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
      gl.uniform1f(splatProgram.uniforms.radius, CFG.SPLAT_RADIUS);
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
    // a hundred+ pixels between two consecutive events.
    const splatAlongStroke = (fromX: number, fromY: number, toX: number, toY: number) => {
      const dx = toX - fromX;
      const dy = toY - fromY;
      const dist = Math.hypot(dx, dy);
      const steps = Math.max(1, Math.ceil(dist / CFG.SPLAT_SPACING));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const x = fromX + dx * t;
        const y = fromY + dy * t;
        splat(x, y, dx / steps, dy / steps);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const { x, y } = toUv(e.clientX, e.clientY);
      lastInputTime = performance.now();
      if (lastPointer.has) {
        splatAlongStroke(lastPointer.x, lastPointer.y, x, y);
      }
      lastPointer = { x, y, has: true };
    };
    const handlePointerLeave = () => {
      lastPointer.has = false;
    };

    // No touch-action: none — a drag across the mark should still let the
    // page scroll normally; we only ever read pointer position.
    wrapper.addEventListener("pointermove", handlePointerMove);
    wrapper.addEventListener("pointerleave", handlePointerLeave);
    wrapper.addEventListener("pointercancel", handlePointerLeave);

    // ---- resize ----
    const resize = () => {
      const rect = wrapper.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
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

    const step = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 1 / 30);
      lastTime = now;

      // Idle drift: only gated on time-since-last-input, never on
      // (hover: none) — gating on that media query would make a touch
      // device drift while it's actively being touched, fighting the
      // user's own input.
      if (now - lastInputTime > CFG.IDLE_DELAY * 1000) {
        idleAngle += dt * 0.6;
        const cx = 0.5 + Math.cos(idleAngle) * 0.28;
        const cy = 0.5 + Math.sin(idleAngle * 1.3) * 0.18;
        const dx = -Math.sin(idleAngle) * 0.28 * dt * 0.6;
        const dy = -Math.cos(idleAngle * 1.3) * 1.3 * 0.18 * dt * 0.6;
        splat(cx, cy, dx, dy);
      }

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
      drawQuad();

      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);

    return () => {
      disposed = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener("orientationchange", resize);
      wrapper.removeEventListener("pointermove", handlePointerMove);
      wrapper.removeEventListener("pointerleave", handlePointerLeave);
      wrapper.removeEventListener("pointercancel", handlePointerLeave);
      wrapper.removeEventListener("pointerdown", handleFirstPointerDown);
      video.removeEventListener("loadedmetadata", handleVideoMeta);
      video.removeEventListener("canplay", attemptPlay);
      document.removeEventListener("visibilitychange", handleVisibility);
      video.pause();
    };
  }, [logoSrc, videoSrc, prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <div ref={wrapperRef} className={className} style={{ position: "relative" }}>
      <video
        ref={videoRef}
        aria-hidden="true"
        tabIndex={-1}
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        style={{ position: "absolute", objectFit: "cover" }}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
      <canvas ref={canvasRef} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", touchAction: "pan-y" }} />
    </div>
  );
});

export default FluidInkReveal;
