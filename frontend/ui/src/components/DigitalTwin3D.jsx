import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const THULAGI = { riskScore: 84, position: [0, 15, -10], flowDirection: [0.5, -0.1, 1] };

function Terrain() {
  // Load the SRTM displacement map
  const displacementMap = useLoader(THREE.TextureLoader, '/assets/srtm_thulagi.png');

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
      <planeGeometry args={[100, 100, 256, 256]} />
      <meshStandardMaterial
        color="#374151"
        displacementMap={displacementMap}
        displacementScale={20}
        wireframe={false}
        roughness={0.9}
        metalness={0.1}
      />
    </mesh>
  );
}

function ThreatVisuals({ isCritical }) {
  const ringRef = useRef(null);
  const color = isCritical ? "#EF4444" : "#22c55e"; // Red if critical, Green if safe

  useFrame((state) => {
    if (ringRef.current) {
      // Pulse scale
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      ringRef.current.scale.set(scale, scale, scale);
      ringRef.current.material.opacity = 1 - (scale - 1) * 3;
    }
  });

  return (
    <group position={THULAGI.position}>
      {/* Core Risk Zone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <circleGeometry args={[3, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </mesh>

      {/* Pulsing Alert Ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
        <ringGeometry args={[3.2, 3.8, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function HazardBoundary({ isCritical }) {
  if (!isCritical) return null;

  // Mock GeoJSON payload anticipating the Phase 1 PostGIS backend
  const mockHazardGeoJSON = {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [[
        [84.3833, 28.5333], // Origin (Thulagi Lake)
        [84.3950, 28.5100], // Downstream left
        [84.4200, 28.4600], // Far downstream left (Impact zone)
        [84.4100, 28.4550], // Far downstream right
        [84.3850, 28.5150], // Downstream right
        [84.3833, 28.5333]  // Close polygon
      ]]
    }
  };

  // GeoJSON to Three.js Local Space Parser
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const coords = mockHazardGeoJSON.geometry.coordinates[0];
    
    // Thulagi GPS origin maps to THULAGI.position [0, 5, -10]
    const originLon = 84.3833;
    const originLat = 28.5333;
    const scale = 800; // Scaling factor for projection

    coords.forEach(([lon, lat], index) => {
      const x = (lon - originLon) * scale + THULAGI.position[0];
      const z = -(lat - originLat) * scale + THULAGI.position[2];
      
      if (index === 0) s.moveTo(x, z);
      else s.lineTo(x, z);
    });
    return s;
  }, []);

  return (
    // Hovering above the terrain displacement for easy viewing
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 15.5, 0]}>
      <shapeGeometry args={[shape]} />
      <meshBasicMaterial color="#EF4444" transparent opacity={0.15} side={THREE.DoubleSide} />
      <lineSegments>
        <edgesGeometry args={[new THREE.ShapeGeometry(shape)]} />
        <lineBasicMaterial color="#EF4444" transparent opacity={0.8} />
      </lineSegments>
    </mesh>
  );
}

function FloodParticles() {
  const pointsRef = useRef(null);
  const particleCount = 1000;

  // Initialize particle positions
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      // Spread them slightly around the origin of the flow
      pos[i * 3] = THULAGI.position[0] + (Math.random() - 0.5) * 4;
      pos[i * 3 + 1] = THULAGI.position[1] + (Math.random() - 0.5) * 0.5;
      pos[i * 3 + 2] = THULAGI.position[2] + (Math.random() - 0.5) * 4;
    }
    return pos;
  }, []);

  const speeds = useMemo(() => {
    return new Float32Array(particleCount).map(() => Math.random() * 0.5 + 0.1);
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position.array;

    for (let i = 0; i < particleCount; i++) {
      // Move along flowDirection
      pos[i * 3] += THULAGI.flowDirection[0] * speeds[i] * delta * 15;
      pos[i * 3 + 1] += THULAGI.flowDirection[1] * speeds[i] * delta * 15;
      pos[i * 3 + 2] += THULAGI.flowDirection[2] * speeds[i] * delta * 15;

      // Calculate distance traveled from origin using simple squared distance
      const dx = pos[i * 3] - THULAGI.position[0];
      const dz = pos[i * 3 + 2] - THULAGI.position[2];
      const distSq = dx * dx + dz * dz;

      // If travel > 40 units (1600 sq), reset
      if (distSq > 1600) {
        pos[i * 3] = THULAGI.position[0] + (Math.random() - 0.5) * 4;
        pos[i * 3 + 1] = THULAGI.position[1] + (Math.random() - 0.5) * 0.5;
        pos[i * 3 + 2] = THULAGI.position[2] + (Math.random() - 0.5) * 4;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#EF4444" size={0.5} transparent opacity={0.6} blending={THREE.AdditiveBlending} />
    </points>
  );
}

export default function DigitalTwin3D({ isCritical }) {
  return (
    <Canvas camera={{ position: [20, 30, 40], fov: 45 }}>
      <fogExp2 attach="fog" color="#050505" density={0.01} />
      
      {/* Lighting Fix: Make the terrain visible instead of a dark void */}
      <ambientLight intensity={0.6} color="#ffffff" />
      <hemisphereLight skyColor="#ffffff" groundColor="#222222" intensity={0.6} />
      
      {/* High-angle DirectionalLight for sharp but visible mountain shadows */}
      <directionalLight 
        position={[20, 50, 10]} 
        intensity={2.5} 
        color="#ffffff" 
        castShadow 
      />

      <Terrain />
      
      {/* The visuals depend on the critical state from the Run Analysis button */}
      <ThreatVisuals isCritical={isCritical} />
      <HazardBoundary isCritical={isCritical} />
      
      {/* Only show the catastrophic particle flow if the risk is critical */}
      {isCritical && <FloodParticles />}

      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxPolarAngle={Math.PI / 2 - 0.1} // Prevent going under the plane
      />
    </Canvas>
  );
}
