import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Decal } from '@react-three/drei';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

// Custom hook to map GPS coordinates to local 3D Cartesian coordinates
function useGeoToLocal(centerLng, centerLat) {
  return useMemo(() => {
    // Approx scaling factor to convert degrees to arbitrary 3D units
    const scale = 500;
    return (lng, lat) => {
      const x = (lng - centerLng) * scale;
      const z = -(lat - centerLat) * scale; // Invert Z to match map conventions
      return new THREE.Vector3(x, 0, z);
    };
  }, [centerLng, centerLat]);
}

// ─── TERRAIN ─────────────────────────────────────────────────────────────
function Terrain({ children }) {
  const meshRef = useRef();
  
  // Create procedural noise for heightmap
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(100, 100, 128, 128);
    geo.rotateX(-Math.PI / 2); // Make it horizontal
    
    const noise2D = createNoise2D();
    const pos = geo.attributes.position;
    
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Generate some mountain-like displacement
      let y = noise2D(x * 0.05, z * 0.05) * 5;
      y += noise2D(x * 0.1, z * 0.1) * 2;
      pos.setY(i, Math.max(-1, y)); // Don't let valleys go too deep
    }
    
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh ref={meshRef} geometry={geometry} receiveShadow>
      {/* Cinematic dark terrain material - brightened slightly for visibility */}
      <meshStandardMaterial color="#2a2a2a" roughness={0.8} metalness={0.2} />
      {/* We render decals (children) directly into this mesh group so they project onto the terrain */}
      {children}
    </mesh>
  );
}

// ─── LAKE SURFACE ────────────────────────────────────────────────────────
function LakeSurface({ polygonCoords, geoToLocal }) {
  const meshRef = useRef();
  
  if (!polygonCoords || polygonCoords.length === 0) return null;

  const shape = useMemo(() => {
    const s = new THREE.Shape();
    // Draw the polygon
    polygonCoords[0].forEach((coord, i) => {
      const pos = geoToLocal(coord[0], coord[1]);
      if (i === 0) s.moveTo(pos.x, pos.z); // Note: Shape is 2D (x,y), we use x,z
      else s.lineTo(pos.x, pos.z);
    });
    return s;
  }, [polygonCoords, geoToLocal]);

  const geometry = useMemo(() => {
    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(-Math.PI / 2); // Lay flat
    geo.translate(0, 0.5, 0); // Float slightly above terrain
    return geo;
  }, [shape]);

  return (
    <mesh geometry={geometry}>
      <meshPhysicalMaterial 
        color="#06b6d4"
        emissive="#06b6d4"
        emissiveIntensity={0.5}
        transmission={0.9}
        opacity={1}
        transparent
        roughness={0.1}
        thickness={2}
      />
    </mesh>
  );
}

// ─── RIVER PARTICLE FLOW ─────────────────────────────────────────────────
function RiverFlow({ lineCoords, geoToLocal }) {
  const pointsRef = useRef();
  
  if (!lineCoords || lineCoords.length < 2) return null;

  const curve = useMemo(() => {
    const points = lineCoords.map(coord => {
      const pos = geoToLocal(coord[0], coord[1]);
      // Give the river a slight downward slope, or keep it above terrain
      return new THREE.Vector3(pos.x, 1, pos.z);
    });
    return new THREE.CatmullRomCurve3(points);
  }, [lineCoords, geoToLocal]);

  // Particle system logic
  const particleCount = 500;
  const positions = useMemo(() => new Float32Array(particleCount * 3), []);
  const progresses = useMemo(() => new Float32Array(particleCount).map(() => Math.random()), []);

  useFrame((state, delta) => {
    if (!curve || !pointsRef.current) return;
    
    const speed = 0.2; // Flow speed
    for (let i = 0; i < particleCount; i++) {
      progresses[i] = (progresses[i] + delta * speed) % 1;
      const point = curve.getPointAt(progresses[i]);
      
      // Add slight turbulence
      positions[i * 3] = point.x + (Math.random() - 0.5) * 0.2;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z + (Math.random() - 0.5) * 0.2;
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
      <pointsMaterial 
        color="#38bdf8" 
        size={0.15} 
        transparent 
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─── HAZARD DECAL ────────────────────────────────────────────────────────
function HazardZone({ polygonCoords, geoToLocal, isCritical }) {
  if (!isCritical || !polygonCoords || polygonCoords.length === 0) return null;

  // We find the bounding box of the polygon to size the Decal
  const boundingBox = useMemo(() => {
    const box = new THREE.Box3();
    polygonCoords[0].forEach(coord => {
      box.expandByPoint(geoToLocal(coord[0], coord[1]));
    });
    return box;
  }, [polygonCoords, geoToLocal]);

  const center = boundingBox.getCenter(new THREE.Vector3());
  const size = boundingBox.getSize(new THREE.Vector3());
  
  // Ensure the decal is thick enough on the Y axis to project onto the displaced terrain
  size.y = 20; 
  // Add a bit of padding to x and z
  size.x += 2;
  size.z += 2;

  return (
    <Decal
      position={[center.x, 0, center.z]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={[size.x, size.z, size.y]}
    >
      <meshBasicMaterial 
        color="#ef4444" 
        transparent 
        opacity={0.15} 
        polygonOffset 
        polygonOffsetFactor={-1} 
      />
    </Decal>
  );
}

// ─── MAIN DIGITAL TWIN COMPONENT ─────────────────────────────────────────
export default function DigitalTwin3D({ spatialData, activeLake, isCritical }) {
  // We center the 3D world around the active lake's coordinates
  const centerLng = activeLake.coordinates.lng;
  const centerLat = activeLake.coordinates.lat;
  const geoToLocal = useGeoToLocal(centerLng, centerLat);

  // Extract features from GeoJSON
  const lakeFeature = spatialData?.features?.find(f => f.properties.layer_type === 'lake');
  const riverFeature = spatialData?.features?.find(f => f.properties.layer_type === 'river');
  const hazardFeature = spatialData?.features?.find(f => f.properties.layer_type === 'impact_boundary');

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: '#050505' }}>
      <Canvas camera={{ position: [0, 15, 20], fov: 45 }}>
        <ambientLight intensity={0.2} />
        <directionalLight position={[10, 20, 10]} intensity={1} color="#ffffff" />
        <pointLight position={[0, 5, 0]} intensity={0.5} color="#06b6d4" />
        
        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          enableRotate={true}
          maxPolarAngle={Math.PI / 2 - 0.05} // Don't go below ground
          minDistance={5}
          maxDistance={50}
        />

        <Terrain>
          <HazardZone 
            polygonCoords={hazardFeature?.geometry?.coordinates} 
            geoToLocal={geoToLocal} 
            isCritical={isCritical} 
          />
        </Terrain>

        <LakeSurface 
          polygonCoords={lakeFeature?.geometry?.coordinates} 
          geoToLocal={geoToLocal} 
        />
        
        <RiverFlow 
          lineCoords={riverFeature?.geometry?.coordinates} 
          geoToLocal={geoToLocal} 
        />
        
        {/* Subtle fog for atmospheric cinematic depth */}
        <fog attach="fog" args={['#050505', 10, 60]} />
      </Canvas>
    </div>
  );
}
