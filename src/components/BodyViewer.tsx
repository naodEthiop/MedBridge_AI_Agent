"use client";

import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";

interface BodyViewerProps {
  onSelectPart: (part: string) => void;
}

const MESH_TO_API_MAP: Record<string, string> = {
  head: "head",
  chest: "chest",
  abdomen: "stomach",
  arm_left: "arms",
  arm_right: "arms",
  leg_left: "legs",
  leg_right: "legs",
};

function Model({ onSelectPart }: { onSelectPart: (part: string) => void }) {
  // Assume the GLB has the required meshes
  const { nodes } = useGLTF("/models/body.glb") as any;
  
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const groupRef = useRef<THREE.Group>(null);

  // Small breathing animation
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const scale = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.005;
      groupRef.current.scale.set(scale, scale, scale);
    }
  });

  const handlePointerOver = (e: any, name: string) => {
    e.stopPropagation();
    setHovered(name);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setHovered(null);
    document.body.style.cursor = 'default';
  };

  const handleClick = async (e: any, name: string) => {
    e.stopPropagation();
    setSelected(name);
    setErrorMsg(null);
    
    const apiPart = MESH_TO_API_MAP[name] || name;
    
    try {
      const res = await fetch(`/api/symptoms/body-map?bodyPart=${apiPart}`);
      if (!res.ok) throw new Error("API Failed");
      const data = await res.json();
      
      onSelectPart(apiPart);
    } catch (err) {
      setErrorMsg("Failed to fetch info. Part selected locally.");
      onSelectPart(apiPart);
    }
  };

  const targetMeshes = ["head", "chest", "abdomen", "arm_left", "arm_right", "leg_left", "leg_right"];

  return (
    <group ref={groupRef} dispose={null} position={[0, -1, 0]}>
      {targetMeshes.map((name) => {
        const mesh = nodes[name];
        if (!mesh) return null;

        const isHovered = hovered === name;
        const isSelected = selected === name;

        return (
          <mesh
            key={name}
            geometry={mesh.geometry}
            onPointerOver={(e) => handlePointerOver(e, name)}
            onPointerOut={handlePointerOut}
            onClick={(e) => handleClick(e, name)}
          >
            <meshStandardMaterial
              color={isSelected ? "#ffaa00" : "#f1f5f9"}
              emissive={isHovered ? "#60a5fa" : isSelected ? "#f59e0b" : "#000000"}
              emissiveIntensity={isHovered ? 0.4 : isSelected ? 0.3 : 0}
              transparent
              opacity={0.85}
              roughness={0.6}
            />
            {isHovered && (
              <Html position={[0, 0, 0]} center style={{ pointerEvents: 'none' }}>
                <div className="bg-stone-900 text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap opacity-90 shadow-lg">
                  {name.replace("_", " ").toUpperCase()}
                </div>
              </Html>
            )}
          </mesh>
        );
      })}
      
      {errorMsg && (
        <Html position={[0, 2, 0]} center>
          <div className="bg-red-500/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap shadow-md">
            {errorMsg}
          </div>
        </Html>
      )}
    </group>
  );
}

export function BodyViewer({ onSelectPart }: BodyViewerProps) {
  return (
    <div className="w-full h-[450px] relative rounded-3xl bg-gradient-to-b from-blue-50/50 to-white/50 border border-sahara-border/60 overflow-hidden shadow-sm">
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} color="#ffffff" />
        <React.Suspense fallback={
          <Html center>
            <div className="text-sahara-primary font-medium tracking-wide animate-pulse bg-white/80 px-4 py-2 rounded-xl shadow-sm border border-stone-100">
              Loading Anatomy Model...
            </div>
          </Html>
        }>
          <Model onSelectPart={onSelectPart} />
        </React.Suspense>
      </Canvas>
    </div>
  );
}

// Preload the model
useGLTF.preload("/models/body.glb");
