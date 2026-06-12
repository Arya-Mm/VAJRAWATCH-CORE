import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function RiskOverlay() {
  const overlayRef = useRef(null);

  useFrame((state) => {
    if (!overlayRef.current) return;

    // Slow rotation to simulate active geospatial HUD scan
    overlayRef.current.rotation.z = state.clock.getElapsedTime() * 0.06;
  });

  return (
    <group ref={overlayRef} position={[0, 0.12, 0]}>
      {/* 1. Risk Ring (Red - 1.4m scale radius) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.4, 1.45, 64]} />
        <meshBasicMaterial
          color="#ef4444"
          side={THREE.DoubleSide}
          transparent
          opacity={0.75}
        />
      </mesh>

      {/* 2. Impact Ring (Orange - 3.2m scale radius) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.2, 3.25, 64]} />
        <meshBasicMaterial
          color="#f97316"
          side={THREE.DoubleSide}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* 3. Monitoring Ring (Green - 6.5m scale radius) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[6.5, 6.54, 64]} />
        <meshBasicMaterial
          color="#10b981"
          side={THREE.DoubleSide}
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  );
}
