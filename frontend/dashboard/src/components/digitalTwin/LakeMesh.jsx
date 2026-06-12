import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export default function LakeMesh() {
  const waterRef = useRef(null);

  useFrame((state) => {
    if (!waterRef.current) return;

    // Gentle wave/tide oscillation
    const elapsed = state.clock.getElapsedTime();
    waterRef.current.position.y = 0.05 + Math.sin(elapsed * 1.6) * 0.008;

    // Subtle breathing scale simulation to suggest shoreline expansion/retraction
    const scaleFactor = 1.0 + Math.cos(elapsed * 1.2) * 0.006;
    waterRef.current.scale.set(scaleFactor, scaleFactor, 1);
  });

  return (
    <mesh
      ref={waterRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.05, 0]}
      castShadow
    >
      <circleGeometry args={[1.05, 64]} />
      <meshStandardMaterial
        color="#0891b2"
        roughness={0.15}
        metalness={0.25}
        transparent={true}
        opacity={0.78}
        flatShading={false}
      />
    </mesh>
  );
}
