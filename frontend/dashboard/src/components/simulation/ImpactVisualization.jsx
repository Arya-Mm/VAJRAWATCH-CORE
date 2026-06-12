import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export default function ImpactVisualization({ maxProgress }) {
  const pulsesRef = useRef([]);

  // Timing thresholds for downstream GLOF impact
  const bridgeHit = maxProgress >= 0.35;  // 5 min onwards
  const roadHit = maxProgress >= 0.65;    // 15 min onwards
  const hydroHit = maxProgress >= 1.0;    // 30 min onwards
  const villageHit = maxProgress >= 1.0;  // 30 min onwards

  useFrame((state) => {
    // Pulse animation for impacted assets
    const time = state.clock.getElapsedTime();
    const pulseScale = 1.0 + Math.sin(time * 6) * 0.15; // fast warning blink

    pulsesRef.current.forEach((mesh) => {
      if (mesh) {
        mesh.scale.set(pulseScale, pulseScale, pulseScale);
      }
    });
  });

  // Colors based on status
  const bridgeColor = bridgeHit ? '#ef4444' : '#10b981';
  const roadColor = roadHit ? '#ef4444' : '#10b981';
  const hydroColor = hydroHit ? '#ef4444' : '#10b981';
  const villageColor = villageHit ? '#ef4444' : '#10b981';

  return (
    <group>
      {/* 1. Bridge Crossing (Z = 2.4) */}
      <group position={[0.45, -0.16, 2.4]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.0, 0.08, 0.25]} />
          <meshStandardMaterial color={bridgeColor} roughness={0.5} />
        </mesh>
        {bridgeHit && (
          <mesh ref={(el) => (pulsesRef.current[0] = el)} position={[0, 0.15, 0]}>
            <coneGeometry args={[0.08, 0.16, 4]} />
            <meshBasicMaterial color="#ef4444" wireframe />
          </mesh>
        )}
      </group>

      {/* 2. Mountain Road Segment (Z = 3.4) */}
      <group position={[-0.4, -0.27, 3.4]}>
        <mesh rotation={[0, Math.PI / 4, 0]}>
          <boxGeometry args={[0.15, 0.03, 1.2]} />
          <meshStandardMaterial color={roadColor} roughness={0.8} />
        </mesh>
        {roadHit && (
          <mesh ref={(el) => (pulsesRef.current[1] = el)} position={[0, 0.15, 0]}>
            <coneGeometry args={[0.08, 0.16, 4]} />
            <meshBasicMaterial color="#ef4444" wireframe />
          </mesh>
        )}
      </group>

      {/* 3. Hydropower Plant (Z = 4.2) */}
      <group position={[-0.25, -0.37, 4.2]}>
        <mesh castShadow>
          <boxGeometry args={[0.4, 0.25, 0.3]} />
          <meshStandardMaterial color={hydroColor} roughness={0.4} metalness={0.5} />
        </mesh>
        {hydroHit && (
          <mesh ref={(el) => (pulsesRef.current[2] = el)} position={[0, 0.25, 0]}>
            <coneGeometry args={[0.08, 0.16, 4]} />
            <meshBasicMaterial color="#ef4444" wireframe />
          </mesh>
        )}
      </group>

      {/* 4. Downstream Village / Houses (Z = 4.9) */}
      <group position={[0.1, -0.42, 4.9]}>
        {/* Render a cluster of 3 houses */}
        <mesh position={[-0.15, 0, -0.1]} castShadow>
          <boxGeometry args={[0.16, 0.12, 0.16]} />
          <meshStandardMaterial color={villageColor} />
        </mesh>
        <mesh position={[0.1, 0, 0.1]} castShadow>
          <boxGeometry args={[0.18, 0.14, 0.14]} />
          <meshStandardMaterial color={villageColor} />
        </mesh>
        <mesh position={[-0.05, 0, 0.2]} castShadow>
          <boxGeometry args={[0.14, 0.1, 0.14]} />
          <meshStandardMaterial color={villageColor} />
        </mesh>
        {villageHit && (
          <mesh ref={(el) => (pulsesRef.current[3] = el)} position={[0, 0.25, 0]}>
            <coneGeometry args={[0.08, 0.16, 4]} />
            <meshBasicMaterial color="#ef4444" wireframe />
          </mesh>
        )}
      </group>
    </group>
  );
}
