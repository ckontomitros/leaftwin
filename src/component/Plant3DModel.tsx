// src/components/Plant3DModel.tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Float } from "@react-three/drei";
import { Plant } from "@/lib/plantData";
import { useRef } from "react";

interface Plant3DModelProps {
  plant: Plant;
}

export default function Plant3DModel({ plant }: Plant3DModelProps) {
  const healthColor = 
    plant.health === "healthy" ? "#22C55E" :
    plant.health === "warning" ? "#F59E0B" : "#EF4444";

  return (
    <div className="h-80 rounded-xl overflow-hidden bg-gradient-to-b from-sky-100 to-sky-50 shadow-inner">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 1, 6]} />
        <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} castShadow />

        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
          {/* Trunk */}
          <mesh position={[0, 0, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.25, 2]} />
            <meshStandardMaterial color="#8B4513" />
          </mesh>

          {/* Foliage */}
          <mesh position={[0, 1.3, 0]} castShadow>
            <sphereGeometry args={[1.4, 20, 20]} />
            <meshStandardMaterial 
              color={healthColor} 
              opacity={plant.health === "critical" ? 0.6 : 0.95}
              transparent
            />
          </mesh>

          {/* Extra leaves */}
          <mesh position={[0.5, 1.5, 0.3]} rotation={[0, 0, 0.3]}>
            <coneGeometry args={[0.6, 1.2, 8]} />
            <meshStandardMaterial color={healthColor} />
          </mesh>
          <mesh position={[-0.6, 1.4, -0.2]} rotation={[0, 0, -0.3]}>
            <coneGeometry args={[0.5, 1, 8]} />
            <meshStandardMaterial color={healthColor} />
          </mesh>
        </Float>

        {/* Soil */}
        <mesh position={[0, -1.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[2]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
      </Canvas>
    </div>
  );
}