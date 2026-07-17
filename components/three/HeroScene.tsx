"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import type { Group } from "three";
import { gsap } from "@/lib/motion/gsap";

/**
 * Procedural placeholder centerpiece for the hero — no GLB asset exists yet.
 * Built so a real Blender-exported model can drop in later: swap the <mesh>
 * for a <primitive object={gltf.scene} />, everything else (float, lights,
 * scroll-driven scale/position) stays the same.
 */
export default function HeroScene() {
  const groupRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
      groupRef.current.rotation.x += delta * 0.04;
    }
  });

  useEffect(() => {
    if (!groupRef.current) return;

    const ctx = gsap.context(() => {
      gsap.to(groupRef.current!.scale, {
        x: 0.55,
        y: 0.55,
        z: 0.55,
        ease: "none",
        scrollTrigger: {
          trigger: "#hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
      gsap.to(groupRef.current!.position, {
        y: -1.4,
        ease: "none",
        scrollTrigger: {
          trigger: "#hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <>
      <ambientLight intensity={0.18} />
      <pointLight position={[4, 3, 5]} intensity={60} color="#6b8ff8" />
      <pointLight position={[-3, -1, 2]} intensity={18} color="#2a33f3" />
      <pointLight position={[0, -4, -2]} intensity={14} color="#6b8ff8" />

      <Float speed={1.4} rotationIntensity={0.5} floatIntensity={0.9}>
        <group ref={groupRef} position={[1.1, -0.2, -0.5]}>
          <mesh>
            <icosahedronGeometry args={[1.25, 1]} />
            <MeshDistortMaterial
              color="#1c23c2"
              emissive="#2a33f3"
              emissiveIntensity={0.08}
              roughness={0.25}
              metalness={0.75}
              distort={0.12}
              speed={1.2}
              flatShading
            />
          </mesh>
        </group>
      </Float>
    </>
  );
}
