"use client";

import { Canvas, type CanvasProps } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { Suspense, useState, type ReactNode } from "react";

interface SceneCanvasProps extends Omit<CanvasProps, "dpr" | "children"> {
  children: ReactNode;
}

/**
 * Shared <Canvas> defaults for every 3D scene: capped/adaptive DPR via
 * PerformanceMonitor (degrades on weak hardware instead of tanking FPS),
 * and a Suspense boundary so lazy-loaded assets don't block the section.
 * Whether to mount this at all (reduced-motion / mobile) is a decision
 * each section makes, not this wrapper.
 */
export function SceneCanvas({ children, ...props }: SceneCanvasProps) {
  const [dpr, setDpr] = useState(1.5);

  return (
    <Canvas
      dpr={dpr}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 5], fov: 45 }}
      {...props}
    >
      <PerformanceMonitor
        onIncline={() => setDpr((current) => Math.min(2, current + 0.5))}
        onDecline={() => setDpr((current) => Math.max(1, current - 0.5))}
      />
      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  );
}
