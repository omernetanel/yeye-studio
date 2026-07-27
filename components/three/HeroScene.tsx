"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { gsap } from "@/lib/motion/gsap";

// Downsampling the real logo file (not a redrawn approximation) into a grid
// of "ink" pixels is what makes this read as the actual YEYE mark rather
// than a generic particle blob.
const SAMPLE_WIDTH = 220;
const BRIGHTNESS_THRESHOLD = 120;
const WORLD_WIDTH = 1.8;
const GROUP_X = -2.15;
const GROUP_Y = 0.6;

// How strongly, and from how close, particles get pulled toward the cursor —
// a small, localized nudge only for dots the cursor is actually near, not a
// whole-shape reaction.
const INFLUENCE_RADIUS = 0.55;
const PULL_STRENGTH = 0.3;
const EASE = 0.12;
// A finite "nowhere near anything" sentinel for when the pointer ray misses
// the tracking plane. Infinity would work arithmetically for the influence
// falloff, but Infinity * 0 is NaN in JS, which permanently corrupts a
// particle's position the moment that happens — this sidesteps it entirely.
const NO_HIT_SENTINEL = 999;

async function sampleLogoPoints(): Promise<Float32Array> {
  const img = new Image();
  img.src = "/images/logo.png";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("logo image failed to load"));
  });

  const aspect = img.naturalHeight / img.naturalWidth;
  const w = SAMPLE_WIDTH;
  const h = Math.max(1, Math.round(w * aspect));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return new Float32Array();
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  const worldHeight = WORLD_WIDTH * aspect;
  const points: number[] = [];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const alpha = data[idx + 3];
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      if (alpha > 40 && brightness > BRIGHTNESS_THRESHOLD) {
        // Center and flip Y (image space is y-down, world space is y-up).
        points.push((x / w - 0.5) * WORLD_WIDTH, -(y / h - 0.5) * worldHeight, (Math.random() - 0.5) * 0.3);
      }
    }
  }

  return new Float32Array(points);
}

/**
 * The YEYE mark, rendered as a dense particle cloud sampled straight from
 * the real logo file. It sits still — always fully readable — and only the
 * dots near the cursor nudge slightly, like a soft local gravity well.
 *
 * The mutable "live" positions never pass through React state or JSX —
 * they're mutated in place every frame, the standard R3F escape hatch for
 * animating buffer geometry without forcing a React re-render 60 times a
 * second.
 */
export default function HeroScene() {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const basePositionsRef = useRef<Float32Array | null>(null);
  const livePositionsRef = useRef<Float32Array | null>(null);
  const [ready, setReady] = useState(false);

  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const intersection = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    let cancelled = false;
    sampleLogoPoints().then((pts) => {
      if (cancelled || pts.length === 0) return;
      basePositionsRef.current = pts;
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useFrame((state) => {
    const points = pointsRef.current;
    const base = basePositionsRef.current;
    if (!points || !base || !groupRef.current) return;

    // One-time setup, done lazily here (rather than in an effect) so this
    // is the only place that ever touches the buffer attribute — mixing an
    // effect-driven setup with frame-loop mutation of the same ref is what
    // trips up the immutability check.
    let live = livePositionsRef.current;
    if (!live) {
      live = base.slice();
      livePositionsRef.current = live;
      points.geometry.setAttribute("position", new THREE.BufferAttribute(live, 3));
    }

    const geometry = points.geometry;

    raycaster.setFromCamera(state.pointer, state.camera);
    const hit = raycaster.ray.intersectPlane(plane, intersection);
    const mouseX = hit ? intersection.x - groupRef.current.position.x : NO_HIT_SENTINEL;
    const mouseY = hit ? intersection.y - groupRef.current.position.y : NO_HIT_SENTINEL;

    for (let i = 0; i < base.length; i += 3) {
      const bx = base[i];
      const by = base[i + 1];

      const dx = mouseX - bx;
      const dy = mouseY - by;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const influence = Math.max(0, 1 - dist / INFLUENCE_RADIUS);
      const pull = influence * influence * PULL_STRENGTH;

      const targetX = bx + dx * pull;
      const targetY = by + dy * pull;

      live[i] += (targetX - live[i]) * EASE;
      live[i + 1] += (targetY - live[i + 1]) * EASE;
    }

    (geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  });

  useEffect(() => {
    if (!groupRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to(groupRef.current!.scale, {
        x: 0.6,
        y: 0.6,
        z: 0.6,
        ease: "none",
        scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to(groupRef.current!.position, {
        y: GROUP_Y - 1.1,
        ease: "none",
        scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
      });
    });
    return () => ctx.revert();
  }, [ready]);

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[4, 3, 5]} intensity={35} color="#6b8ff8" />

      <group ref={groupRef} position={[GROUP_X, GROUP_Y, 0]}>
        <points ref={pointsRef} visible={ready}>
          <bufferGeometry />
          <pointsMaterial
            color="#6b8ff8"
            size={0.024}
            sizeAttenuation
            transparent
            opacity={0.9}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      </group>
    </>
  );
}
