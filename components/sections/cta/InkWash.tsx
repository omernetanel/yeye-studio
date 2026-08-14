"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";

/**
 * The ink from the Hero, at the other end of the page, with nothing behind it.
 *
 * THIS DUPLICATES THE FLUID SOLVER IN components/sections/hero/FluidInkReveal.
 * That is deliberate and it should stay that way. The Hero's copy carries a
 * painted paper canvas, a video sampled through the dye, the wordmark's crop
 * geometry and the rects it inverts inside — none of which exist here, and all
 * of which are load-bearing for a section that is finished and signed off.
 * Factoring the two together would put the opening screen of the site on the
 * end of a refactor for the sake of the closing one. The solver is a known
 * quantity, it does not change, and a copy of it is the cheap half of that
 * trade.
 *
 * What this one does instead: it paints BLACK where the ink is and nothing
 * anywhere else. The heading above it is set in WHITE with
 * `mix-blend-mode: difference`, which on the white page renders it black — and
 * renders it white wherever this canvas has put ink under it. So the words
 * inverting as the ink crosses them is the same effect as the Hero's, arrived
 * at through the compositor rather than through a shader, because here there is
 * no paper texture to sample and nothing to reveal behind.
 */

// Same numbers as the Hero's. They were tuned against a wordmark of roughly
// this size on roughly this amount of screen, and the point is that the two
// ends of the page feel like the same ink rather than two similar effects.
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

// Where the Hero's display shader reveals a paper texture, this one just states
// how much ink is at each pixel. Black everywhere, with the density carried
// entirely in alpha, so the page shows through untouched wherever there is none
// and the compositor gets a clean mask to blend the heading against.
const DISPLAY_SHADER = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
uniform sampler2D uDye;
uniform float maskLo;
uniform float maskHi;
out vec4 fragColor;
void main () {
  float density = texture(uDye, vUv).r;
  float ink = smoothstep(maskLo, maskHi, density);
  fragColor = vec4(0.0, 0.0, 0.0, ink);
}`;

type FBO = { texture: WebGLTexture; fbo: WebGLFramebuffer; width: number; height: number; texelSizeX: number; texelSizeY: number; attach: (id: number) => number };
type DoubleFBO = { read: FBO; write: FBO; swap: () => void; width: number; height: number; texelSizeX: number; texelSizeY: number };

export default function InkWash({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      depth: false,
      stencil: false,
    });
    // No WebGL2 is not a failure state: the section is a heading and a button
    // and reads perfectly well without any of this.
    if (!gl) return;

    const floatExt = gl.getExtension("EXT_color_buffer_float");
    if (!floatExt) return;
    const linear = gl.getExtension("OES_texture_float_linear");
    const filtering = linear ? gl.LINEAR : gl.NEAREST;

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    const vertex = compile(gl.VERTEX_SHADER, BASE_VERTEX_SHADER);
    const build = (fragmentSource: string) => {
      const program = gl.createProgram()!;
      gl.attachShader(program, vertex);
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
      gl.linkProgram(program);
      const uniforms: Record<string, WebGLUniformLocation | null> = {};
      const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
      for (let i = 0; i < count; i += 1) {
        const name = gl.getActiveUniform(program, i)!.name;
        uniforms[name] = gl.getUniformLocation(program, name);
      }
      return { program, uniforms };
    };

    const programs = {
      splat: build(SPLAT_SHADER),
      advection: build(ADVECTION_SHADER),
      curl: build(CURL_SHADER),
      vorticity: build(VORTICITY_SHADER),
      divergence: build(DIVERGENCE_SHADER),
      pressure: build(PRESSURE_SHADER),
      gradient: build(GRADIENT_SUBTRACT_SHADER),
      clear: build(CLEAR_SHADER),
      display: build(DISPLAY_SHADER),
    };

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    const indices = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    const blit = (target: FBO | null) => {
      if (target) {
        gl.viewport(0, 0, target.width, target.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      } else {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    };

    const createFBO = (w: number, h: number, internal: number, format: number, type: number, filter: number): FBO => {
      gl.activeTexture(gl.TEXTURE0);
      const texture = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, null);
      const fbo = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      gl.viewport(0, 0, w, h);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return {
        texture, fbo, width: w, height: h,
        texelSizeX: 1 / w, texelSizeY: 1 / h,
        attach(id: number) {
          gl.activeTexture(gl.TEXTURE0 + id);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          return id;
        },
      };
    };

    const createDoubleFBO = (w: number, h: number, internal: number, format: number, type: number, filter: number): DoubleFBO => {
      let fbo1 = createFBO(w, h, internal, format, type, filter);
      let fbo2 = createFBO(w, h, internal, format, type, filter);
      return {
        width: w, height: h, texelSizeX: 1 / w, texelSizeY: 1 / h,
        get read() { return fbo1; },
        set read(value) { fbo1 = value; },
        get write() { return fbo2; },
        set write(value) { fbo2 = value; },
        swap() { const temp = fbo1; fbo1 = fbo2; fbo2 = temp; },
      };
    };

    const simRes = (resolution: number) => {
      const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
      const ratio = aspect < 1 ? 1 / aspect : aspect;
      const min = Math.round(resolution);
      const max = Math.round(resolution * ratio);
      return aspect > 1 ? { width: max, height: min } : { width: min, height: max };
    };

    let dye: DoubleFBO;
    let velocity: DoubleFBO;
    let divergenceFBO: FBO;
    let curlFBO: FBO;
    let pressureFBO: DoubleFBO;

    const initFramebuffers = () => {
      const sim = simRes(CFG.SIM_RES);
      const dyeSize = simRes(CFG.DYE_RES);
      const { RGBA16F, RG16F, R16F, RGBA, RG, RED, HALF_FLOAT } = gl;
      dye = createDoubleFBO(dyeSize.width, dyeSize.height, RGBA16F, RGBA, HALF_FLOAT, filtering);
      velocity = createDoubleFBO(sim.width, sim.height, RG16F, RG, HALF_FLOAT, filtering);
      divergenceFBO = createFBO(sim.width, sim.height, R16F, RED, HALF_FLOAT, gl.NEAREST);
      curlFBO = createFBO(sim.width, sim.height, R16F, RED, HALF_FLOAT, gl.NEAREST);
      pressureFBO = createDoubleFBO(sim.width, sim.height, R16F, RED, HALF_FLOAT, gl.NEAREST);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (w === canvas.width && h === canvas.height) return false;
      canvas.width = w;
      canvas.height = h;
      return true;
    };
    resize();
    initFramebuffers();

    // Splats are queued from input and drained on the frame, so a burst of
    // pointer events in one frame does not run the solver once per event.
    const pending: { x: number; y: number; dx: number; dy: number }[] = [];
    let last: { x: number; y: number } | null = null;

    const push = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width;
      const y = 1 - (clientY - rect.top) / rect.height;
      if (x < 0 || x > 1 || y < 0 || y > 1) {
        last = null;
        return;
      }
      if (last) {
        const dx = x - last.x;
        const dy = y - last.y;
        if (Math.hypot(dx, dy) < CFG.SPLAT_SPACING) return;
        pending.push({ x, y, dx: dx * CFG.SPLAT_FORCE, dy: dy * CFG.SPLAT_FORCE });
      }
      last = { x, y };
    };

    const onPointerMove = (event: PointerEvent) => push(event.clientX, event.clientY);
    // Touch goes through touchmove, not pointermove: the browser cancels the
    // pointer stream the instant it decides a drag is a scroll, which is what
    // made the Hero's ink appear and die on phones.
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) push(touch.clientX, touch.clientY);
    };
    const onLeave = () => {
      last = null;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);

    const splat = (x: number, y: number, dx: number, dy: number) => {
      gl.useProgram(programs.splat.program);
      gl.uniform1i(programs.splat.uniforms.uTarget, velocity.read.attach(0));
      gl.uniform1f(programs.splat.uniforms.aspectRatio, canvas.width / canvas.height);
      gl.uniform2f(programs.splat.uniforms.point, x, y);
      gl.uniform3f(programs.splat.uniforms.color, dx, dy, 0);
      gl.uniform1f(programs.splat.uniforms.radius, CFG.SPLAT_RADIUS);
      blit(velocity.write);
      velocity.swap();

      gl.uniform1i(programs.splat.uniforms.uTarget, dye.read.attach(0));
      gl.uniform3f(programs.splat.uniforms.color, 1, 1, 1);
      blit(dye.write);
      dye.swap();
    };

    let frame = 0;
    let previous = performance.now();
    let visible = false;

    const step = (dt: number) => {
      gl.disable(gl.BLEND);

      gl.useProgram(programs.curl.program);
      gl.uniform2f(programs.curl.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(programs.curl.uniforms.uVelocity, velocity.read.attach(0));
      blit(curlFBO);

      gl.useProgram(programs.vorticity.program);
      gl.uniform2f(programs.vorticity.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(programs.vorticity.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(programs.vorticity.uniforms.uCurl, curlFBO.attach(1));
      gl.uniform1f(programs.vorticity.uniforms.curl, CFG.CURL);
      gl.uniform1f(programs.vorticity.uniforms.dt, dt);
      blit(velocity.write);
      velocity.swap();

      gl.useProgram(programs.divergence.program);
      gl.uniform2f(programs.divergence.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(programs.divergence.uniforms.uVelocity, velocity.read.attach(0));
      blit(divergenceFBO);

      gl.useProgram(programs.clear.program);
      gl.uniform1i(programs.clear.uniforms.uTexture, pressureFBO.read.attach(0));
      gl.uniform1f(programs.clear.uniforms.value, CFG.PRESSURE);
      blit(pressureFBO.write);
      pressureFBO.swap();

      gl.useProgram(programs.pressure.program);
      gl.uniform2f(programs.pressure.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(programs.pressure.uniforms.uDivergence, divergenceFBO.attach(0));
      for (let i = 0; i < CFG.PRESSURE_ITERATIONS; i += 1) {
        gl.uniform1i(programs.pressure.uniforms.uPressure, pressureFBO.read.attach(1));
        blit(pressureFBO.write);
        pressureFBO.swap();
      }

      gl.useProgram(programs.gradient.program);
      gl.uniform2f(programs.gradient.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(programs.gradient.uniforms.uPressure, pressureFBO.read.attach(0));
      gl.uniform1i(programs.gradient.uniforms.uVelocity, velocity.read.attach(1));
      blit(velocity.write);
      velocity.swap();

      gl.useProgram(programs.advection.program);
      gl.uniform2f(programs.advection.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(programs.advection.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(programs.advection.uniforms.uSource, velocity.read.attach(0));
      gl.uniform1f(programs.advection.uniforms.dt, dt);
      gl.uniform1f(programs.advection.uniforms.dissipation, CFG.VELOCITY_DISSIPATION);
      blit(velocity.write);
      velocity.swap();

      gl.uniform1i(programs.advection.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(programs.advection.uniforms.uSource, dye.read.attach(1));
      gl.uniform1f(programs.advection.uniforms.dissipation, CFG.DENSITY_DISSIPATION);
      blit(dye.write);
      dye.swap();
    };

    const render = () => {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(programs.display.program);
      gl.uniform1i(programs.display.uniforms.uDye, dye.read.attach(0));
      gl.uniform1f(programs.display.uniforms.maskLo, CFG.MASK_LO);
      gl.uniform1f(programs.display.uniforms.maskHi, CFG.MASK_HI);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      blit(null);
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min((now - previous) / 1000, 0.016666);
      previous = now;
      if (!visible) return;
      if (resize()) initFramebuffers();
      while (pending.length) {
        const s = pending.shift()!;
        splat(s.x, s.y, s.dx, s.dy);
      }
      step(dt);
      render();
    };

    const watcher = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (!visible) return;
        previous = performance.now();
        // Sized here rather than only at mount. At mount this section is far
        // below the fold and has not been laid out at its real width yet, so
        // the buffer allocated then is the wrong shape entirely.
        if (resize()) initFramebuffers();
      },
      { rootMargin: "10% 0px" },
    );
    watcher.observe(canvas);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      watcher.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [prefersReducedMotion]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
