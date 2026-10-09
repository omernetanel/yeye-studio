"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";
import "./Lanyard.css";

/**
 * A name badge on a band: a card that hangs, swings in a light wind, can be
 * taken hold of, stretched, thrown and turned over.
 *
 * A TypeScript port of Lanyard from React Bits (THIRD_PARTY_NOTICES.md). What
 * changed on the way in:
 *
 * - IT COMES TO REST ON A PLACE THE PAGE ALREADY KEEPS. Theirs sizes the card
 *   as a share of its own box and hangs it wherever that falls. Here the stage
 *   is laid over a slot in the page and told how far it reaches past that slot
 *   (`inset`), and the card is framed to hang exactly on the slot - so putting
 *   the badge on a page moves nothing on it.
 * - TWO BANDS, as well as one. `straps={2}` hangs the card from a pair that
 *   come in from either side and meet at the clip, the way a badge sits when
 *   it is worn - for a place where one band from the top would be a long line
 *   down the screen. The simulation holds any number of bands for it; theirs
 *   holds exactly one.
 * - It drops in from above. Theirs swings in from the side.
 * - The card's shape follows the picture (`aspect`); theirs is one of two fixed
 *   sizes.
 * - Less of it: the holographic and metallic finishes, with the foil shader
 *   they needed, the landscape card, and the choice of three metals are gone.
 *   Nothing here uses them.
 * - Reduced motion is not read here. The caller does not mount the badge at
 *   all then, and shows the picture; that is the site's own answer and covers
 *   its accessibility panel as well as the system's setting.
 * - No colour is written here. The card and the band take theirs as props.
 *
 * Decoration to assistive technology: the canvas is hidden from it, and the
 * picture's description belongs to the image the caller keeps under the stage.
 */

const CARD_HEIGHT = 2.25;
const THICKNESS = 0.018;
const BEVEL = 0.007;
const JOINTS = 4;
const NODE_WEIGHT = 1 / 0.05;
const MAX_STEP = 1 / 960;
const ITERATIONS = 2;
const SAMPLES = 72;
const FOV = 24;
const STRAP_WIDTH = 0.36;
const RING_RADIUS = 0.095;
const RING_TUBE = 0.0135;
const EYELET_RADIUS = 0.036;
const CLAMP_BODY = 0.15;
const FACE_WIDTH = 1024;
const FLIP_SPIN = 9;

const FINISHES = {
  glossy: { roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.06 },
  matte: { roughness: 0.85, clearcoat: 0, clearcoatRoughness: 0.6 },
};

// The clip and the ring: a pale steel, as light off metal and not as a colour
// of the page's.
const METAL = { color: [0.72, 0.74, 0.78] as const, roughness: 0.16 };

const BAND_COLUMNS = [0, 0.07, 0.93, 1];
const BAND_BEND = [-0.95, -0.28, 0.28, 0.95];

type Rgb = [number, number, number];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Any CSS colour, as the browser itself resolves it. */
const parseColor = (value: string, fallback: Rgb): Rgb => {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return fallback;
  ctx.fillStyle = "#000000";
  ctx.fillStyle = value;
  const resolved = ctx.fillStyle;
  if (resolved.startsWith("#")) {
    const n = parseInt(resolved.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  const parts = resolved.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return fallback;
  return [Number(parts[0]) / 255, Number(parts[1]) / 255, Number(parts[2]) / 255];
};

const luminance = (rgb: Rgb) => 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
const toCss = (rgb: Rgb, alpha = 1) =>
  `rgba(${Math.round(rgb[0] * 255)}, ${Math.round(rgb[1] * 255)}, ${Math.round(rgb[2] * 255)}, ${alpha})`;

const seeded = (start: number) => {
  let state = start >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const traceRoundedRect = (path: THREE.Path, x: number, y: number, width: number, height: number, radius: number) => {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  const k = r * 0.4477;
  path.moveTo(x + r, y);
  path.lineTo(x + width - r, y);
  path.bezierCurveTo(x + width - k, y, x + width, y + k, x + width, y + r);
  path.lineTo(x + width, y + height - r);
  path.bezierCurveTo(x + width, y + height - k, x + width - k, y + height, x + width - r, y + height);
  path.lineTo(x + r, y + height);
  path.bezierCurveTo(x + k, y + height, x, y + height - k, x, y + height - r);
  path.lineTo(x, y + r);
  path.bezierCurveTo(x, y + k, x + k, y, x + r, y);
};

const loadImage = (url: string | undefined) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });

interface CardLayout {
  width: number;
  height: number;
  radius: number;
  slot: { width: number; height: number; y: number };
  ringY: number;
  /** Where the band takes hold of the card, above its centre. */
  hangY: number;
}

const cardLayout = (aspect: number, cornerRadius: number): CardLayout => {
  const height = CARD_HEIGHT;
  const width = height * aspect;
  const radius = mix(0.03, Math.min(width, height) * 0.2, clamp(cornerRadius, 0, 1));
  const slot = { width: 0.34, height: 0.07, y: height / 2 - 0.13 };
  const ringY = height / 2 - 0.055;
  return { width, height, radius, slot, ringY, hangY: ringY + RING_RADIUS };
};

const buildCardGeometry = (layout: CardLayout) => {
  const { width, height, radius, slot } = layout;
  const outline = new THREE.Shape();
  traceRoundedRect(
    outline,
    -width / 2 + BEVEL,
    -height / 2 + BEVEL,
    width - BEVEL * 2,
    height - BEVEL * 2,
    Math.max(radius - BEVEL, 0.005),
  );
  const hole = new THREE.Path();
  traceRoundedRect(
    hole,
    -slot.width / 2 - BEVEL,
    slot.y - slot.height / 2 - BEVEL,
    slot.width + BEVEL * 2,
    slot.height + BEVEL * 2,
    slot.height / 2 + BEVEL,
  );
  outline.holes.push(hole);
  const body = new THREE.ExtrudeGeometry(outline, {
    depth: THICKNESS,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 5,
    curveSegments: 24,
  });
  body.translate(0, 0, -THICKNESS / 2);
  const face = new THREE.ShapeGeometry(outline, 24);
  const position = face.getAttribute("position");
  const uv = face.getAttribute("uv");
  for (let i = 0; i < position.count; i++) {
    uv.setXY(i, (position.getX(i) + width / 2) / width, (position.getY(i) + height / 2) / height);
  }
  uv.needsUpdate = true;
  return { body, face };
};

const buildClampGeometry = (width: number) => {
  const shape = new THREE.Shape();
  const w = width * 1.16;
  traceRoundedRect(shape, -w / 2 + 0.014, -CLAMP_BODY / 2 + 0.014, w - 0.028, CLAMP_BODY - 0.028, 0.024);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.014,
    bevelSegments: 6,
    curveSegments: 10,
  });
  geometry.translate(0, 0, -0.01);
  return geometry;
};

const buildBandGeometry = (count: number) => {
  const columns = BAND_COLUMNS.length;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * columns * 3), 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(count * columns * 3), 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(count * columns * 2), 2));
  const index: number[] = [];
  for (let i = 0; i < count - 1; i++) {
    for (let c = 0; c < columns - 1; c++) {
      const a = i * columns + c;
      index.push(a, a + columns, a + 1, a + 1, a + columns, a + columns + 1);
    }
  }
  geometry.setIndex(index);
  return geometry;
};

/** A small room of light panels for the card and the metal to reflect. */
const buildEnvironment = (renderer: THREE.WebGLRenderer) => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0.035, 0.035, 0.04);
  const geometry = new THREE.PlaneGeometry(1, 1);
  const materials: THREE.Material[] = [];
  const panel = (intensity: number, position: [number, number, number], scale: [number, number], rotation = 0) => {
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(intensity, intensity, intensity),
      side: THREE.DoubleSide,
    });
    materials.push(material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.scale.set(scale[0], scale[1], 1);
    mesh.lookAt(0, 0, 0);
    mesh.rotateZ(rotation);
    scene.add(mesh);
  };
  panel(2.6, [0, 4.5, 8], [9, 4]);
  panel(6, [-5.5, 0.5, 7], [0.9, 14]);
  panel(4, [5, -0.5, 8], [0.6, 14]);
  panel(3.5, [0, -1, 9], [24, 0.35], Math.PI / 3);
  panel(2.5, [1, 2.5, 9], [24, 0.2], Math.PI / 3);
  panel(1.4, [0, 6, -6], [12, 4]);
  panel(0.5, [0, -7, 1], [16, 6]);
  panel(0.9, [8, 0, -2], [4, 10]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(scene, 0.035);
  pmrem.dispose();
  geometry.dispose();
  materials.forEach((material) => material.dispose());
  return target;
};

const makeCanvasTexture = (canvas: HTMLCanvasElement, anisotropy: number) => {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
};

/** The faint tooth of printed card, as a normal map. */
const buildGrainTexture = () => {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);
  const random = seeded(7);
  const field = Float32Array.from({ length: size * size }, () => random());
  const height = (x: number, y: number) => {
    let sum = 0;
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) sum += field[((y + j + size) % size) * size + ((x + i + size) % size)];
    }
    return (sum / 9) * 1.6;
  };
  const image = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = height((x - 1 + size) % size, y) - height((x + 1) % size, y);
      const ny = height(x, (y - 1 + size) % size) - height(x, (y + 1) % size);
      const length = Math.hypot(nx, ny, 1);
      const i = (y * size + x) * 4;
      image.data[i] = ((nx / length) * 0.5 + 0.5) * 255;
      image.data[i + 1] = ((ny / length) * 0.5 + 0.5) * 255;
      image.data[i + 2] = ((1 / length) * 0.5 + 0.5) * 255;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 7);
  return texture;
};

/** The band's weave, as a normal map. */
const buildWeaveTexture = () => {
  const size = 128;
  const threads = 8;
  const random = seeded(19);
  const fiber = Float32Array.from({ length: size * size }, () => random());
  const profile = (f: number) => Math.sqrt(Math.max(0, 1 - 4 * f * f));
  const height = (x: number, y: number) => {
    const px = ((x % size) + size) % size;
    const py = ((y % size) + size) % size;
    const u = (px / size) * threads;
    const v = (py / size) * threads;
    const cu = Math.floor(u);
    const cv = Math.floor(v);
    const fu = u - cu - 0.5;
    const fv = v - cv - 0.5;
    const lift = (cu + cv) % 2 === 0;
    const warp = profile(fu) * (0.55 + 0.45 * Math.cos(fv * Math.PI * (lift ? 1 : 0.6)));
    const weft = profile(fv) * (0.55 + 0.45 * Math.cos(fu * Math.PI * (lift ? 0.6 : 1)));
    return (lift ? Math.max(warp, weft * 0.7) : Math.max(weft, warp * 0.7)) + fiber[py * size + px] * 0.08;
  };
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (height(x - 1, y) - height(x + 1, y)) * 1.6;
      const ny = (height(x, y - 1) - height(x, y + 1)) * 1.6;
      const length = Math.hypot(nx, ny, 1);
      const i = (y * size + x) * 4;
      data[i] = ((nx / length) * 0.5 + 0.5) * 255;
      data[i + 1] = ((ny / length) * 0.5 + 0.5) * 255;
      data[i + 2] = ((1 / length) * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
};

/** The picture, filling the face of the card and cropped to it. */
const paintFace = (canvas: HTMLCanvasElement, image: HTMLImageElement | null, color: Rgb) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = toCss(color);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!image) return;
  const scale = Math.max(canvas.width / image.width, canvas.height / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  ctx.drawImage(image, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
};

/** The band's print: an image repeated along it, or stitching on a plain one. */
const paintStrap = (canvas: HTMLCanvasElement, image: HTMLImageElement | null, color: Rgb) => {
  const across = 192;
  const along = image ? Math.max(64, Math.round((image.width / image.height) * across)) : across * 2;
  canvas.width = across;
  canvas.height = along;
  const ctx = canvas.getContext("2d");
  if (!ctx) return along / across;
  ctx.fillStyle = toCss(color);
  ctx.fillRect(0, 0, across, along);
  if (image) {
    ctx.save();
    ctx.translate(across, 0);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(image, 0, 0, along, across);
    ctx.restore();
    return along / across;
  }
  const ink: Rgb = luminance(color) > 0.5 ? [0, 0, 0] : [1, 1, 1];
  ctx.fillStyle = toCss(ink, 0.05);
  for (let y = 0; y < along; y += 4) ctx.fillRect(0, y, across, 1);
  ctx.fillStyle = toCss(ink, 0.2);
  for (let y = 0; y < along; y += 14) {
    ctx.fillRect(across * 0.075, y, 2, 8);
    ctx.fillRect(across * 0.925 - 2, y, 2, 8);
  }
  return along / across;
};

/** One band: a row of points from where it is fixed down to the card. */
interface Chain {
  anchor: THREE.Vector3;
  nodes: THREE.Vector3[];
  previous: THREE.Vector3[];
  velocities: THREE.Vector3[];
  lengths: Float64Array;
  impulses: Float64Array;
  /** The slack length of one of its segments, as the solver holds it now. */
  rest: number;
  /** That length once the band is all out. */
  cut: number;
  /**
   * Still running out: on the way in the card is further from where a band is
   * fixed than the band is long, so until it has come within reach the band
   * is let out to it and holds nothing.
   */
  payingOut: boolean;
}

interface Grab {
  local: THREE.Vector3;
  rotation: THREE.Quaternion;
  reach: number;
  from: THREE.Vector3;
  target: THREE.Vector3;
}

interface Body {
  position: THREE.Vector3;
  previous: THREE.Vector3;
  velocity: THREE.Vector3;
  quaternion: THREE.Quaternion;
  previousQuaternion: THREE.Quaternion;
  angular: THREE.Vector3;
  mass: number;
  inverseInertia: THREE.Vector3;
  hang: THREE.Vector3;
}

interface Simulation {
  chains: Chain[];
  body: Body;
  grab: Grab | null;
  /** Where the card hangs when nothing is moving. */
  restHang: THREE.Vector3;
  turn: number;
  twist: number;
  twistRaw: number;
  calm: number;
}

interface Physics {
  gravity: number;
  hold: number;
  stiffness: number;
  spring: number;
  bandDamping: number;
  linearDrag: number;
  angularDrag: number;
  air: number;
  broadside: number;
  spinAir: number;
  nodeDrag: number;
  nodeAir: number;
  twist: number;
  twistDamping: number;
  grip: number;
  gripDamping: number;
  breeze: number;
}

const createChain = (): Chain => {
  const vectors = () => Array.from({ length: JOINTS + 1 }, () => new THREE.Vector3());
  return {
    anchor: new THREE.Vector3(),
    nodes: vectors(),
    previous: vectors(),
    velocities: vectors(),
    lengths: new Float64Array(JOINTS),
    impulses: new Float64Array(JOINTS),
    rest: 1,
    cut: 1,
    payingOut: false,
  };
};

const createSimulation = (straps: number): Simulation => ({
  chains: Array.from({ length: straps }, createChain),
  body: {
    position: new THREE.Vector3(),
    previous: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    quaternion: new THREE.Quaternion(),
    previousQuaternion: new THREE.Quaternion(),
    angular: new THREE.Vector3(),
    mass: 1,
    inverseInertia: new THREE.Vector3(1, 1, 1),
    hang: new THREE.Vector3(),
  },
  grab: null,
  restHang: new THREE.Vector3(),
  turn: 0,
  twist: 0,
  twistRaw: 0,
  calm: 0,
});

const scratch = {
  a: new THREE.Vector3(),
  b: new THREE.Vector3(),
  c: new THREE.Vector3(),
  d: new THREE.Vector3(),
  e: new THREE.Vector3(),
  f: new THREE.Vector3(),
  g: new THREE.Vector3(),
  pin: new THREE.Vector3(),
  q: new THREE.Quaternion(),
  r: new THREE.Quaternion(),
};

const applyInverseInertia = (body: Body, vector: THREE.Vector3, out: THREE.Vector3) => {
  scratch.r.copy(body.quaternion).invert();
  out.copy(vector).applyQuaternion(scratch.r);
  out.set(out.x * body.inverseInertia.x, out.y * body.inverseInertia.y, out.z * body.inverseInertia.z);
  return out.applyQuaternion(body.quaternion);
};

const rotateBody = (q: THREE.Quaternion, w: THREE.Vector3) => {
  const { x: qx, y: qy, z: qz, w: qw } = q;
  q.x += 0.5 * (w.x * qw + w.y * qz - w.z * qy);
  q.y += 0.5 * (w.y * qw + w.z * qx - w.x * qz);
  q.z += 0.5 * (w.z * qw + w.x * qy - w.y * qx);
  q.w += 0.5 * (-w.x * qx - w.y * qy - w.z * qz);
  q.normalize();
};

const bodyWeight = (body: Body, r: THREE.Vector3, normal: THREE.Vector3) => {
  const rn = scratch.c.crossVectors(r, normal);
  return 1 / body.mass + rn.dot(applyInverseInertia(body, rn, scratch.d));
};

const pushBody = (body: Body, r: THREE.Vector3, impulse: THREE.Vector3) => {
  body.position.addScaledVector(impulse, 1 / body.mass);
  rotateBody(body.quaternion, applyInverseInertia(body, scratch.e.crossVectors(r, impulse), scratch.f));
};

/** A band only ever pulls: one of its segments, held to its length. */
const solveSegment = (body: Body, chain: Chain, i: number, h: number, physics: Physics) => {
  const { nodes } = chain;
  const a = nodes[i];
  const wa = i === 0 ? 0 : NODE_WEIGHT;
  const last = i === JOINTS - 1;
  const r = scratch.g;
  let b = nodes[i + 1];
  if (last) {
    r.copy(body.hang).applyQuaternion(body.quaternion);
    b = scratch.b.copy(body.position).add(r);
  }
  const delta = scratch.a.subVectors(b, a);
  const length = delta.length();
  const stretch = length - chain.rest;
  if (stretch <= 0 || length < 1e-9) return;
  const normal = delta.divideScalar(length);
  const wb = last ? bodyWeight(body, r, normal) : NODE_WEIGHT;
  const rate = (length - chain.lengths[i]) / h;
  const tension =
    physics.hold * Math.tanh((physics.stiffness * stretch) / physics.hold) +
    physics.spring * stretch +
    physics.bandDamping * Math.max(0, rate);
  const room = tension * h * h - chain.impulses[i];
  if (room <= 0) return;
  const lambda = Math.min(stretch / (wa + wb), room);
  chain.impulses[i] += lambda;
  if (wa) a.addScaledVector(normal, lambda * wa);
  if (last) pushBody(body, r, normal.multiplyScalar(-lambda));
  else b.addScaledVector(normal, -lambda * wb);
};

const solvePin = (body: Body, grab: Grab, target: THREE.Vector3) => {
  const r = scratch.g.copy(grab.local).applyQuaternion(body.quaternion);
  const delta = scratch.a.copy(target).sub(body.position).sub(r);
  const distance = delta.length();
  if (distance < 1e-9) return;
  const normal = delta.divideScalar(distance);
  const lambda = distance / bodyWeight(body, r, normal);
  pushBody(body, r, normal.multiplyScalar(lambda));
};

/**
 * Puts the card where it hangs at rest - or, for the entrance, that far above
 * the stage that none of it shows, a little to one side and a little tilted,
 * with the bands slack between. Gravity does the rest.
 */
const placeHanging = (sim: Simulation, layout: CardLayout, dropFrom: number | null) => {
  const { body } = sim;
  const hang = scratch.pin.copy(sim.restHang);
  body.quaternion.identity();
  if (dropFrom !== null) {
    hang.y = dropFrom;
    hang.x += 0.18;
    body.quaternion.setFromAxisAngle(scratch.a.set(0, 0, 1), 0.2);
  }
  body.hang.set(0, layout.hangY, 0);
  body.position.copy(hang).sub(scratch.a.copy(body.hang).applyQuaternion(body.quaternion));
  body.previous.copy(body.position);
  body.previousQuaternion.copy(body.quaternion);
  body.velocity.set(0, 0, 0);
  body.angular.set(0, 0, 0);
  for (const chain of sim.chains) {
    chain.payingOut = dropFrom !== null;
    chain.rest = chain.cut;
    for (let i = 0; i <= JOINTS; i++) {
      chain.nodes[i].lerpVectors(chain.anchor, hang, i / JOINTS);
      chain.previous[i].copy(chain.nodes[i]);
      chain.velocities[i].set(0, 0, 0);
    }
    for (let i = 0; i < JOINTS; i++) chain.lengths[i] = chain.nodes[i].distanceTo(chain.nodes[i + 1]);
  }
  sim.turn = 0;
  sim.twist = 0;
  sim.twistRaw = 0;
  sim.calm = 0;
};

const stepSimulation = (sim: Simulation, dt: number, physics: Physics, time: number) => {
  const steps = Math.max(1, Math.ceil(dt / MAX_STEP - 1e-6));
  const h = dt / steps;
  const { chains, body } = sim;
  const windX = physics.breeze * (Math.sin(time * 0.53) * 0.7 + Math.sin(time * 1.31 + 1.7) * 0.3) * 3;
  const windZ = physics.breeze * Math.sin(time * 0.37 + 0.6) * 2;
  const grab = sim.grab;
  const pin = scratch.pin;
  const nodeDrag = Math.exp(-physics.nodeDrag * h);
  const linearDrag = Math.exp(-physics.linearDrag * h);
  const angularDrag = Math.exp(-physics.angularDrag * h);

  for (let s = 0; s < steps; s++) {
    for (const chain of chains) {
      if (chain.payingOut) {
        const reach = chain.anchor.distanceTo(chain.nodes[JOINTS]) / JOINTS;
        chain.payingOut = reach > chain.cut;
        chain.rest = chain.payingOut ? reach * 1.02 : chain.cut;
      }
      for (let i = 1; i < JOINTS; i++) {
        const v = chain.velocities[i];
        v.y -= physics.gravity * h;
        v.x += windX * h;
        v.z += windZ * h;
        chain.previous[i].copy(chain.nodes[i]);
        chain.nodes[i].addScaledVector(v, h);
      }
    }

    body.previous.copy(body.position);
    body.previousQuaternion.copy(body.quaternion);
    const q = body.quaternion;
    if (grab) {
      const turn = scratch.q.copy(grab.rotation).multiply(scratch.r.copy(q).invert());
      if (turn.w < 0) turn.set(-turn.x, -turn.y, -turn.z, -turn.w);
      const torque = scratch.a.set(turn.x, turn.y, turn.z).multiplyScalar(2 * physics.grip);
      torque.addScaledVector(body.angular, -physics.gripDamping);
      body.angular.addScaledVector(applyInverseInertia(body, torque, scratch.b), h);
    }
    const up = scratch.a.set(0, 1, 0).applyQuaternion(q);
    const front = scratch.b.set(-up.x * up.z, -up.y * up.z, 1 - up.z * up.z);
    if (front.lengthSq() > 1e-3) {
      const facing = scratch.d.set(0, 0, 1).applyQuaternion(q);
      const raw = Math.atan2(scratch.e.crossVectors(front, facing).dot(up), front.dot(facing));
      let turned = raw - sim.twistRaw;
      if (turned > Math.PI) turned -= Math.PI * 2;
      else if (turned < -Math.PI) turned += Math.PI * 2;
      sim.twist += turned;
      sim.twistRaw = raw;
    }
    if (!grab) {
      const spin = body.angular.dot(up);
      body.angular.addScaledVector(up, (physics.twist * (sim.turn - sim.twist) - physics.twistDamping * spin) * h);
    }
    body.velocity.y -= physics.gravity * h;
    body.velocity.x += windX * 0.35 * h;
    body.velocity.z += windZ * 0.35 * h;
    body.position.addScaledVector(body.velocity, h);
    rotateBody(body.quaternion, scratch.f.copy(body.angular).multiplyScalar(h));

    for (const chain of chains) chain.impulses.fill(0);
    if (grab) pin.lerpVectors(grab.from, grab.target, (s + 1) / steps);
    for (let iteration = 0; iteration < ITERATIONS; iteration++) {
      for (const chain of chains) {
        for (let i = 0; i < JOINTS; i++) solveSegment(body, chain, i, h, physics);
      }
      if (grab) solvePin(body, grab, pin);
    }

    for (const chain of chains) {
      for (let i = 1; i < JOINTS; i++) {
        const v = chain.velocities[i]
          .subVectors(chain.nodes[i], chain.previous[i])
          .divideScalar(h)
          .multiplyScalar(nodeDrag);
        v.multiplyScalar(1 / (1 + physics.nodeAir * v.length() * h));
      }
    }
    body.velocity.subVectors(body.position, body.previous).divideScalar(h);
    const dq = scratch.q.copy(body.previousQuaternion).invert().premultiply(body.quaternion);
    body.angular.set(dq.x, dq.y, dq.z).multiplyScalar((2 / h) * (dq.w < 0 ? -1 : 1));

    const normal = scratch.a.set(0, 0, 1).applyQuaternion(body.quaternion);
    const across = body.velocity.dot(normal);
    const along = scratch.b.copy(body.velocity).addScaledVector(normal, -across);
    along.multiplyScalar(1 / (1 + physics.air * along.length() * h));
    body.velocity
      .copy(along)
      .addScaledVector(normal, across / (1 + physics.broadside * Math.abs(across) * h))
      .multiplyScalar(linearDrag);
    body.angular.multiplyScalar(angularDrag / (1 + physics.spinAir * body.angular.length() * h));
    if (body.velocity.lengthSq() > 3600) body.velocity.setLength(60);
    if (body.angular.lengthSq() > 1600) body.angular.setLength(40);

    for (const chain of chains) {
      chain.nodes[JOINTS].copy(body.hang).applyQuaternion(body.quaternion).add(body.position);
      for (let i = 0; i < JOINTS; i++) chain.lengths[i] = chain.nodes[i].distanceTo(chain.nodes[i + 1]);
    }
  }

  if (grab) grab.from.copy(grab.target);

  let energy = body.velocity.lengthSq() + body.angular.lengthSq() * 0.3;
  for (const chain of chains) {
    for (let i = 1; i < JOINTS; i++) energy += chain.velocities[i].lengthSq() * 0.05;
  }
  sim.calm = energy < 2e-4 ? sim.calm + dt : 0;
};

/** Everything one band needs to be drawn. */
interface BandDrawing {
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>;
  controls: THREE.Vector3[];
  curve: THREE.CatmullRomCurve3;
  points: THREE.Vector3[];
  sides: THREE.Vector3[];
  axis: THREE.Vector3;
  mouth: THREE.Vector3;
  tuck: THREE.Vector3;
}

export interface LanyardProps {
  /** The picture printed on the card's face. */
  frontImage: string;
  /** The picture on its back. Without one the face is printed there too. */
  backImage?: string;
  /** An image printed along the band, repeated down its length. */
  strapImage?: string;
  /** The card itself, where no picture covers it and along its edge. */
  cardColor: string;
  /** The band, where it has no image. */
  strapColor: string;
  /** The card's width over its height. The picture's own, usually. */
  aspect: number;
  /**
   * How far the stage reaches past the place the card rests on, in px, on each
   * side. The stage is positioned by these, and the card is framed to hang
   * exactly on what is left.
   */
  inset: { top: number; left: number; right: number; bottom: number };
  /** One band from above the stage, or a pair coming in from its two sides. */
  straps?: 1 | 2;
  /**
   * How far above the top of the card, in px, the band is fixed. A pair leave
   * the sides of the stage at that height. One band without it runs up off the
   * top of the stage; with it, it ends at a point the caller draws something
   * over - a slot it comes out of.
   */
  rise?: number;
  finish?: keyof typeof FINISHES;
  /** Roundness of the card's corners, 0 to 1. */
  cornerRadius?: number;
  /** Width of the band against its default, 0.4 to 2. */
  strapWidth?: number;
  /** How strongly the card falls. */
  gravity?: number;
  /** How quickly the swinging dies down, 0 to 1. */
  damping?: number;
  /** How hard the band snaps the card back after a stretch, 0 to 1. */
  elasticity?: number;
  /** A light, ever-changing wind that keeps the card moving, 0 to 1. */
  breeze?: number;
  /** Called once, when the card has been drawn with its picture on it. */
  onReady?: () => void;
  /** Called if the browser cannot draw it at all. */
  onUnavailable?: () => void;
  /** Called every time the card is taken hold of. */
  onGrab?: () => void;
  className?: string;
}

export default function Lanyard({
  frontImage,
  backImage,
  strapImage,
  cardColor,
  strapColor,
  aspect,
  inset,
  straps = 1,
  rise,
  finish = "glossy",
  cornerRadius = 0.3,
  strapWidth = 0.65,
  gravity = 1,
  damping = 0.5,
  elasticity = 0.5,
  breeze = 0.5,
  onReady,
  onUnavailable,
  onGrab,
  className,
}: LanyardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // What the scene reads on every frame. The scene is built once and outlives
  // the render that built it, so it looks here for anything that can change.
  const settingsRef = useRef({ gravity, damping, elasticity, breeze, onReady, onUnavailable, onGrab });
  useEffect(() => {
    settingsRef.current = { gravity, damping, elasticity, breeze, onReady, onUnavailable, onGrab };
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      // No WebGL: the caller shows its picture.
      settingsRef.current.onUnavailable?.();
      return undefined;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1;
    const canvas = renderer.domElement;
    canvas.className = "lanyard-canvas";
    canvas.setAttribute("aria-hidden", "true");
    const handle = document.createElement("div");
    handle.className = "lanyard-handle";
    handle.setAttribute("aria-hidden", "true");
    container.append(canvas, handle);

    const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const scene = new THREE.Scene();
    const environment = buildEnvironment(renderer);
    scene.environment = environment.texture;
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(-2.5, 4, 6);
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.35);
    fillLight.position.set(3, -1, 4);
    scene.add(keyLight, fillLight);

    const layout = cardLayout(aspect, cornerRadius);
    const card = parseColor(cardColor, [1, 1, 1]);
    const look = FINISHES[finish];

    const frontCanvas = document.createElement("canvas");
    const backCanvas = document.createElement("canvas");
    const strapCanvas = document.createElement("canvas");
    frontCanvas.width = backCanvas.width = FACE_WIDTH;
    frontCanvas.height = backCanvas.height = Math.round((FACE_WIDTH * layout.height) / layout.width);
    const frontTexture = makeCanvasTexture(frontCanvas, anisotropy);
    const backTexture = makeCanvasTexture(backCanvas, anisotropy);
    const strapTexture = makeCanvasTexture(strapCanvas, anisotropy);
    strapTexture.wrapS = THREE.ClampToEdgeWrapping;
    strapTexture.wrapT = THREE.RepeatWrapping;
    const grain = buildGrainTexture();
    const weave = buildWeaveTexture();

    const faceMaterial = (map: THREE.Texture) =>
      new THREE.MeshPhysicalMaterial({
        map,
        normalMap: grain,
        normalScale: new THREE.Vector2(0.06, 0.06),
        roughness: look.roughness,
        clearcoat: look.clearcoat,
        clearcoatRoughness: look.clearcoatRoughness,
      });
    const frontMaterial = faceMaterial(frontTexture);
    const backMaterial = faceMaterial(backTexture);
    const edgeMaterial = new THREE.MeshPhysicalMaterial({
      roughness: Math.min(look.roughness, 0.35),
      clearcoat: 1,
      clearcoatRoughness: 0.08,
    });
    edgeMaterial.color.setRGB(card[0] * 0.92, card[1] * 0.92, card[2] * 0.92, THREE.SRGBColorSpace);
    const metalMaterial = new THREE.MeshStandardMaterial({ metalness: 1, roughness: METAL.roughness });
    metalMaterial.color.setRGB(...METAL.color);
    const bandMaterial = new THREE.MeshPhysicalMaterial({
      map: strapTexture,
      normalMap: weave,
      normalScale: new THREE.Vector2(0.7, 0.7),
      roughness: 0.68,
      sheen: 1,
      sheenRoughness: 0.42,
      sheenColor: new THREE.Color(0.32, 0.32, 0.34),
      side: THREE.DoubleSide,
    });

    const geometry = buildCardGeometry(layout);
    const cardGroup = new THREE.Group();
    const bodyMesh = new THREE.Mesh(geometry.body, edgeMaterial);
    const frontMesh = new THREE.Mesh(geometry.face, frontMaterial);
    const backMesh = new THREE.Mesh(geometry.face.clone(), backMaterial);
    frontMesh.position.z = THICKNESS / 2 + BEVEL + 0.0006;
    backMesh.rotation.y = Math.PI;
    backMesh.position.z = -(THICKNESS / 2 + BEVEL + 0.0006);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(RING_RADIUS, RING_TUBE, 18, 72), metalMaterial);
    ring.rotation.y = Math.PI / 2 - 0.7;
    ring.position.set(0, layout.ringY, 0);
    cardGroup.add(bodyMesh, frontMesh, backMesh, ring);
    scene.add(cardGroup);

    const strapScale = STRAP_WIDTH * clamp(strapWidth, 0.4, 2);
    const clampGroup = new THREE.Group();
    const clampMesh = new THREE.Mesh(buildClampGeometry(strapScale), metalMaterial);
    clampMesh.position.y = EYELET_RADIUS + CLAMP_BODY / 2 - 0.004;
    const eyelet = new THREE.Mesh(new THREE.TorusGeometry(EYELET_RADIUS, 0.0105, 14, 40), metalMaterial);
    clampGroup.add(clampMesh, eyelet);
    scene.add(clampGroup);

    const sim = createSimulation(straps);
    const bands: BandDrawing[] = sim.chains.map(() => {
      const mesh = new THREE.Mesh(buildBandGeometry(SAMPLES), bandMaterial);
      mesh.frustumCulled = false;
      scene.add(mesh);
      const controls: THREE.Vector3[] = [];
      return {
        mesh,
        controls,
        curve: new THREE.CatmullRomCurve3(controls, false, "centripetal"),
        points: Array.from({ length: SAMPLES }, () => new THREE.Vector3()),
        sides: Array.from({ length: SAMPLES }, () => new THREE.Vector3()),
        axis: new THREE.Vector3(),
        mouth: new THREE.Vector3(),
        tuck: new THREE.Vector3(),
      };
    });

    const view = { width: 1, height: 1 };
    let tileRatio = 2;
    let raf = 0;
    let last = performance.now();
    let time = 0;
    let visible = false;
    let alive = true;
    let placed = false;
    let printed = false;
    let hovering = false;
    let press: { x: number; y: number; time: number; point: THREE.Vector3 } | null = null;
    // The top of the stage, in the scene's units: what the card starts above.
    let stageTop = 0;

    const physics = (): Physics => {
      const s = settingsRef.current;
      const pull = 40 * clamp(s.gravity, 0, 3);
      const weight = Math.max(pull, 20);
      const springy = clamp(s.elasticity, 0, 1);
      const settle = clamp(s.damping, 0, 1);
      return {
        gravity: pull,
        hold: weight * mix(2.2, 5.5, springy),
        stiffness: weight * 10 * JOINTS,
        spring: weight * mix(0.1, 0.4, springy) * JOINTS,
        bandDamping: weight * mix(0.3, 0.08, springy) * JOINTS,
        linearDrag: 0.25 * Math.pow(16, settle),
        angularDrag: 0.5 * Math.pow(12, settle),
        air: 0.15,
        broadside: 0.5,
        spinAir: 0.03,
        nodeDrag: 2,
        nodeAir: 0.2,
        twist: 30,
        twistDamping: 3,
        grip: 40,
        gripDamping: 6,
        breeze: clamp(s.breeze, 0, 1),
      };
    };

    /**
     * Frames the scene so that one of its units is a known number of pixels,
     * and hangs the bands so that the card rests exactly on its place.
     */
    const frameView = () => {
      const cardPx = Math.max(1, view.width - inset.left - inset.right);
      const unit = layout.width / cardPx;
      const viewHeight = view.height * unit;
      const viewWidth = view.width * unit;
      // The card stands at the scene's middle; a stage that reaches further to
      // one side than the other is looked at from that much off centre.
      const centre = ((inset.right - inset.left) / 2) * unit;
      camera.aspect = view.width / view.height;
      camera.position.set(centre, 0, viewHeight / 2 / Math.tan((FOV * Math.PI) / 360));
      camera.lookAt(centre, 0, 0);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();

      stageTop = viewHeight / 2;
      const cardTop = stageTop - inset.top * unit;
      sim.restHang.set(0, cardTop - layout.height / 2 + layout.hangY, 0);
      if (straps === 1) {
        sim.chains[0].anchor.set(0, rise === undefined ? stageTop + 0.2 : cardTop + rise * unit, 0);
      } else {
        const out = viewWidth / 2 + 0.15;
        const up = cardTop + (rise ?? 120) * unit;
        sim.chains[0].anchor.set(centre - out, up, 0);
        sim.chains[1].anchor.set(centre + out, up, 0);
      }

      // A band gives a little under the card's weight, so each is cut short
      // by what it will stretch: with that the card comes to rest on its
      // place and not a few pixels under it. A pair shares the weight, and
      // each of the two carries more of it the flatter it runs.
      const p = physics();
      const { body } = sim;
      const t = THICKNESS + BEVEL * 2;
      body.mass = 1;
      body.inverseInertia.set(
        12 / (layout.height * layout.height + t * t),
        12 / (layout.width * layout.width + t * t),
        12 / (layout.width * layout.width + layout.height * layout.height),
      );
      for (const chain of sim.chains) {
        const length = chain.anchor.distanceTo(sim.restHang);
        const steepness = Math.max(0.2, (chain.anchor.y - sim.restHang.y) / length);
        const tension = (p.gravity * body.mass) / (sim.chains.length * steepness);
        // Half of what the spring alone would give: measured, the solver's
        // two passes leave the card resting that much higher than the sum says.
        const give = (tension / (p.stiffness + p.spring)) * 0.5;
        chain.cut = Math.max(0.05, length / JOINTS - give);
        if (!chain.payingOut) chain.rest = chain.cut;
      }
    };

    const start = () => {
      if (raf || !visible || !alive) return;
      sim.calm = 0;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const work = {
      tangent: new THREE.Vector3(),
      toCamera: new THREE.Vector3(),
      basis: new THREE.Matrix4(),
      bisector: new THREE.Vector3(),
      across: new THREE.Vector3(),
      facing: new THREE.Vector3(),
    };
    const bends = BAND_BEND.map((angle) => [Math.cos(angle), Math.sin(angle)] as const);

    const updateBands = () => {
      const hang = sim.chains[0].nodes[JOINTS];
      const reach = EYELET_RADIUS + CLAMP_BODY + 0.05;
      const { tangent, toCamera, across, facing, bisector } = work;

      // Which way each band leaves the card, and between them the way the
      // clip stands.
      const guides = sim.chains.map((chain, index) => {
        let guide = JOINTS - 1;
        while (guide > 0 && chain.nodes[guide].distanceTo(hang) < reach * 1.1) guide--;
        const axis = bands[index].axis.subVectors(chain.nodes[guide], hang);
        if (axis.lengthSq() < 1e-8) axis.set(0, 1, 0).applyQuaternion(sim.body.quaternion);
        axis.normalize();
        return guide;
      });
      bisector.set(0, 0, 0);
      for (const drawing of bands) bisector.add(drawing.axis);
      if (bisector.lengthSq() < 1e-8) bisector.set(0, 1, 0);
      bisector.normalize();

      sim.chains.forEach((chain, index) => {
        const drawing = bands[index];
        // Into the clip along the way the clip stands, and out of its top
        // along the band's own way: a pair splay from one clip.
        drawing.tuck.copy(hang).addScaledVector(bisector, EYELET_RADIUS + CLAMP_BODY * 0.35);
        drawing.mouth
          .copy(hang)
          .addScaledVector(bisector, EYELET_RADIUS + CLAMP_BODY)
          .addScaledVector(drawing.axis, 0.05);
        drawing.controls.length = 0;
        for (let i = 0; i <= guides[index]; i++) drawing.controls.push(chain.nodes[i]);
        drawing.controls.push(drawing.mouth, drawing.tuck);
        drawing.curve.updateArcLengths();
        const { points, sides } = drawing;
        for (let i = 0; i < SAMPLES; i++) drawing.curve.getPointAt(i / (SAMPLES - 1), points[i]);
        const length = drawing.curve.getLength();
        const held = 1 - drawing.mouth.distanceTo(drawing.tuck) / Math.max(length, 0.001);
        const bandGeometry = drawing.mesh.geometry;
        const position = bandGeometry.getAttribute("position");
        const normal = bandGeometry.getAttribute("normal");
        const uv = bandGeometry.getAttribute("uv");
        const columns = BAND_COLUMNS.length;
        const restLength = chain.cut * JOINTS;
        const repeats = restLength / (strapScale * tileRatio);
        const width = strapScale / Math.pow(Math.max(1, length / Math.max(restLength, 0.001)), 0.35);
        // One band turns with the card it holds. A pair cannot: they would
        // have to cross, so they stay flat and the card turns on its ring.
        const twist = sim.chains.length === 1 ? sim.twist : 0;
        for (let i = 0; i < SAMPLES; i++) {
          tangent.subVectors(points[Math.min(SAMPLES - 1, i + 1)], points[Math.max(0, i - 1)]);
          if (tangent.lengthSq() < 1e-12) tangent.set(0, -1, 0);
          tangent.normalize();
          toCamera.subVectors(camera.position, points[i]).normalize();
          const side = sides[i].crossVectors(toCamera, tangent);
          if (side.lengthSq() < 1e-10) side.copy(i > 0 ? sides[i - 1] : scratch.a.set(1, 0, 0));
          side.normalize();
          if (i > 0 && side.dot(sides[i - 1]) < 0) side.negate();
          const angle = -twist * Math.pow(Math.min(1, i / (SAMPLES - 1) / held), 1.3);
          facing.crossVectors(tangent, side);
          across.copy(side).multiplyScalar(Math.cos(angle)).addScaledVector(facing, Math.sin(angle));
          facing.crossVectors(tangent, across);
          const p = points[i];
          const v = (1 - i / (SAMPLES - 1)) * repeats;
          for (let c = 0; c < columns; c++) {
            const k = i * columns + c;
            const offset = (BAND_COLUMNS[c] - 0.5) * width;
            const [bendCos, bendSin] = bends[c];
            position.setXYZ(k, p.x + across.x * offset, p.y + across.y * offset, p.z + across.z * offset);
            normal.setXYZ(
              k,
              facing.x * bendCos + across.x * bendSin,
              facing.y * bendCos + across.y * bendSin,
              facing.z * bendCos + across.z * bendSin,
            );
            uv.setXY(k, BAND_COLUMNS[c], v);
          }
        }
        position.needsUpdate = true;
        normal.needsUpdate = true;
        uv.needsUpdate = true;
      });

      // The clip: upright along the way the bands leave, its face to the
      // camera - and for one band, turned with it.
      toCamera.subVectors(camera.position, hang).normalize();
      across.crossVectors(bisector, toCamera);
      if (across.lengthSq() < 1e-8) across.set(1, 0, 0);
      across.normalize();
      if (sim.chains.length === 1) {
        facing.crossVectors(across, bisector);
        across.multiplyScalar(Math.cos(-sim.twist)).addScaledVector(facing, Math.sin(-sim.twist));
      }
      facing.crossVectors(across, bisector).normalize();
      work.basis.makeBasis(across, bisector, facing);
      clampGroup.quaternion.setFromRotationMatrix(work.basis);
      clampGroup.position.copy(hang);
    };

    /** Keeps the handle over the card: the box its four corners fall in. */
    const placeHandle = () => {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (let i = 0; i < 4; i++) {
        const corner = scratch.a
          .set(((i & 1) - 0.5) * layout.width, ((i >> 1) - 0.5) * layout.height, 0)
          .applyQuaternion(sim.body.quaternion)
          .add(sim.body.position)
          .project(camera);
        const x = (corner.x * 0.5 + 0.5) * view.width;
        const y = (0.5 - corner.y * 0.5) * view.height;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
      handle.style.transform = `translate(${Math.round(minX)}px, ${Math.round(minY)}px)`;
      handle.style.width = `${Math.round(maxX - minX)}px`;
      handle.style.height = `${Math.round(maxY - minY)}px`;
    };

    const render = () => {
      cardGroup.position.copy(sim.body.position);
      cardGroup.quaternion.copy(sim.body.quaternion);
      updateBands();
      placeHandle();
      renderer.render(scene, camera);
    };

    function tick(now: number) {
      raf = 0;
      if (!alive) return;
      const dt = Math.min(1 / 30, Math.max(1 / 240, (now - last) / 1000));
      last = now;
      time += dt;
      const current = physics();
      stepSimulation(sim, dt, current, time);
      const body = sim.body;
      if (!Number.isFinite(body.position.x + body.position.y + body.position.z + body.quaternion.w)) {
        sim.grab = null;
        placeHanging(sim, layout, null);
      }
      render();
      const resting = sim.calm > 1.2 && !sim.grab && current.breeze === 0;
      if (visible && !resting) raf = requestAnimationFrame(tick);
    }

    Promise.all([loadImage(frontImage), loadImage(backImage), loadImage(strapImage)]).then(([front, back, strap]) => {
      if (!alive) return;
      paintFace(frontCanvas, front, card);
      paintFace(backCanvas, back ?? front, card);
      frontTexture.needsUpdate = true;
      backTexture.needsUpdate = true;
      tileRatio = paintStrap(strapCanvas, strap, parseColor(strapColor, [0.07, 0.07, 0.07]));
      weave.repeat.set(2, 2 * tileRatio);
      strapTexture.needsUpdate = true;
      printed = true;
      render();
      settingsRef.current.onReady?.();
      start();
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const toPointer = (event: { clientX: number; clientY: number }) => {
      const rect = canvas.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
    };

    const pickCard = () => {
      cardGroup.updateMatrixWorld();
      return raycaster.intersectObjects([bodyMesh, frontMesh, backMesh], false)[0] ?? null;
    };

    const setCursor = (value: string) => {
      if (handle.style.cursor !== value) handle.style.cursor = value;
    };

    /** Turns the card over, the way it was pushed. */
    const flip = (point: THREE.Vector3) => {
      const body = sim.body;
      const up = scratch.a.set(0, 1, 0).applyQuaternion(body.quaternion);
      let direction = sim.turn > 0 ? -1 : 1;
      if (sim.turn === 0) {
        const away = scratch.c.subVectors(point, camera.position).normalize();
        direction = scratch.b.subVectors(point, body.position).cross(away).dot(up) < 0 ? -1 : 1;
      }
      sim.turn = sim.turn === 0 ? Math.PI * direction : 0;
      body.angular.addScaledVector(up, FLIP_SPIN * direction);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button > 0) return;
      toPointer(event);
      const hit = pickCard();
      if (!hit) return;
      sim.grab = {
        local: hit.point.clone().sub(sim.body.position).applyQuaternion(sim.body.quaternion.clone().invert()),
        rotation: sim.body.quaternion.clone(),
        reach: hit.distance,
        from: hit.point.clone(),
        target: hit.point.clone(),
      };
      press = { x: event.clientX, y: event.clientY, time: performance.now(), point: hit.point.clone() };
      handle.setPointerCapture(event.pointerId);
      setCursor("grabbing");
      event.preventDefault();
      settingsRef.current.onGrab?.();
      start();
    };

    const onPointerMove = (event: PointerEvent) => {
      toPointer(event);
      if (sim.grab) {
        if (press && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 6) press = null;
        raycaster.ray.at(sim.grab.reach, sim.grab.target);
        start();
        return;
      }
      if (event.pointerType === "touch") return;
      hovering = !!pickCard();
      setCursor(hovering ? "grab" : "");
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!sim.grab) return;
      sim.grab = null;
      // A short press that did not travel is a tap: it turns the card over.
      if (press && event.type === "pointerup" && performance.now() - press.time < 450) flip(press.point);
      press = null;
      if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
      setCursor(hovering && event.pointerType !== "touch" ? "grab" : "");
      start();
    };

    const onPointerLeave = () => {
      hovering = false;
      if (!sim.grab) setCursor("");
    };

    handle.addEventListener("pointerdown", onPointerDown);
    handle.addEventListener("pointermove", onPointerMove);
    handle.addEventListener("pointerleave", onPointerLeave);
    handle.addEventListener("pointerup", onPointerUp);
    handle.addEventListener("pointercancel", onPointerUp);
    handle.addEventListener("lostpointercapture", onPointerUp);

    const resize = () => {
      view.width = Math.max(1, container.clientWidth);
      view.height = Math.max(1, container.clientHeight);
      // A stage can be a whole screen: its canvas is kept to five million
      // pixels, whatever the screen's density.
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(5e6 / (view.width * view.height))),
      );
      renderer.setSize(view.width, view.height, false);
      frameView();
      if (!placed) {
        // Above the top of the stage by the card's own height and a little:
        // none of it shows until it falls.
        placeHanging(sim, layout, stageTop + layout.height + 0.4);
        placed = true;
      }
      if (printed) render();
      start();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    // Nothing moves until the stage is on screen - which is also what makes
    // the card fall in as the reader reaches it, and not before, unseen.
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    intersectionObserver.observe(container);
    const onVisibility = () => {
      if (!document.hidden) start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    resize();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      // The handle goes with its listeners.
      handle.remove();
      [bodyMesh, frontMesh, backMesh, ring, clampMesh, eyelet, ...bands.map((drawing) => drawing.mesh)].forEach(
        (mesh) => mesh.geometry.dispose(),
      );
      [frontMaterial, backMaterial, edgeMaterial, metalMaterial, bandMaterial].forEach((material) =>
        material.dispose(),
      );
      [frontTexture, backTexture, strapTexture, grain, weave].forEach((texture) => texture.dispose());
      environment.dispose();
      renderer.dispose();
      canvas.remove();
    };
    // The scene is built once for the card it is given. Everything that can
    // change while it stands is read from settingsRef; the rest - the picture,
    // the colours, the shape, the stage - belongs to a different card, and a
    // caller that wants one mounts it anew.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The stage reaches past the place it is laid over by its insets.
  const stage: CSSProperties = {
    top: -inset.top,
    bottom: -inset.bottom,
    left: -inset.left,
    right: -inset.right,
  };
  return <div ref={containerRef} className={cn("lanyard", className)} style={stage} />;
}
