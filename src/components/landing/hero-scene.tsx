"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sparkles } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

function NeonRing({
  radius,
  color,
  speed,
}: {
  radius: number;
  color: string;
  speed: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += delta * speed * 0.2;
    ref.current.rotation.y += delta * speed * 0.35;
  });

  return (
    <mesh ref={ref} rotation={[Math.PI / 2.4, 0.2, 0.15]}>
      <torusGeometry args={[radius, 0.035, 32, 128]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.4}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}

function FloatingCard({
  position,
  color,
  scale = 1,
}: {
  position: [number, number, number];
  color: string;
  scale?: number;
}) {
  return (
    <Float speed={1.4} rotationIntensity={0.35} floatIntensity={0.8}>
      <mesh position={position} scale={scale}>
        <boxGeometry args={[1.4, 0.9, 0.06]} />
        <meshStandardMaterial
          color="#0b1220"
          metalness={0.7}
          roughness={0.25}
          transparent
          opacity={0.92}
        />
      </mesh>
      <mesh position={[position[0], position[1], position[2] + 0.04]} scale={scale}>
        <planeGeometry args={[1.2, 0.7]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} />
      </mesh>
    </Float>
  );
}

function CoreOrb() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.2;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.35) * 0.15;
  });

  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1.1, 24]} />
      <MeshDistortMaterial
        color="#14b8a6"
        emissive="#0e7490"
        emissiveIntensity={0.55}
        roughness={0.15}
        metalness={0.85}
        distort={0.28}
        speed={2.2}
      />
    </mesh>
  );
}

function Scene() {
  const cards = useMemo(
    () =>
      [
        { position: [-2.6, 1.1, -0.4] as [number, number, number], color: "#ef4444", scale: 0.85 },
        { position: [2.4, 0.8, 0.2] as [number, number, number], color: "#22c55e", scale: 0.75 },
        { position: [-1.8, -1.2, 0.5] as [number, number, number], color: "#38bdf8", scale: 0.7 },
        { position: [2.0, -1.0, -0.6] as [number, number, number], color: "#f59e0b", scale: 0.8 },
      ] as const,
    []
  );

  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[4, 3, 4]} intensity={1.4} color="#67e8f9" />
      <pointLight position={[-4, -2, 2]} intensity={0.9} color="#2dd4bf" />
      <spotLight
        position={[0, 6, 2]}
        angle={0.45}
        penumbra={0.6}
        intensity={1.2}
        color="#ffffff"
      />

      <CoreOrb />
      <NeonRing radius={2.1} color="#22d3ee" speed={1} />
      <NeonRing radius={2.7} color="#14b8a6" speed={-0.7} />
      <NeonRing radius={3.3} color="#67e8f9" speed={0.45} />

      {cards.map((card) => (
        <FloatingCard key={card.color} {...card} />
      ))}

      <Sparkles
        count={80}
        scale={[10, 6, 4]}
        size={2}
        speed={0.35}
        opacity={0.55}
        color="#a5f3fc"
      />
    </>
  );
}

export function HeroScene() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return (
    <div className="absolute inset-0 -z-10" aria-hidden="true">
      {reduceMotion ? (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.18),transparent_55%)]" />
      ) : (
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 7.5], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(5,8,12,0.75)_75%)]" />
    </div>
  );
}
