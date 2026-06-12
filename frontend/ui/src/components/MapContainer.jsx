import { useState, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Map as MapIcon, Box, AlertTriangle } from 'lucide-react';

// ─── Real 2D Interactive Map (MapLibre) ──────────────
import MapGL, { Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

// ─── 3D Flood Particle System ──────────────
function FloodParticles() {
  const pointsRef = useRef();
  const particleCount = 200;
  
  // FIX: Memoize the array so it is only created once. Prevents WebGL/Vite HMR memory leaks.
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 4;
      pos[i * 3 + 1] = -Math.random() * 15;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    return pos;
  }, [particleCount]);

  useFrame(() => {
    if (pointsRef.current) {
      const pos = pointsRef.current.geometry.attributes.position.array;
      for (let i = 0; i < pos.length; i += 3) {
        pos[i + 1] -= 0.08;
        if (pos[i + 1] < -15) pos[i + 1] = 0;
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef} position={[0, -0.5, -8]} rotation={[-Math.PI / 2, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#3b82f6" size={0.15} transparent opacity={0.8} />
    </points>
  );
}

// ─── Main Map Component ─────────────────────────────────────
export default function MapContainer() {
  const [is3D, setIs3D] = useState(false);

  return (
    <div className="relative w-full h-full bg-[#0a0f1e] overflow-hidden">
      
      {/* ── Toggle UI ── */}
      <div className="absolute top-5 left-5 z-20 flex bg-[#111827]/80 backdrop-blur-md border border-slate-700/50 rounded-lg p-1 shadow-xl">
        <button
          onClick={() => setIs3D(false)}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all ${
            !is3D ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapIcon size={14} /> 2D Map
        </button>
        <button
          onClick={() => setIs3D(true)}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all ${
            is3D ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Box size={14} /> 3D Digital Twin
        </button>
      </div>

      {/* ── 2D Map State (Real Interactive MapLibre) ── */}
      {!is3D && (
        <div className="absolute inset-0 z-10">
          <MapGL
            initialViewState={{
              longitude: 84.4833, // Real coordinates for Thulagi region
              latitude: 28.5333,
              zoom: 11,
              pitch: 45 // Adds a slight dramatic tilt
            }}
            mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
            interactive={true}
          >
            {/* The pulsing red lake marker */}
            <Marker longitude={84.4833} latitude={28.5333} anchor="center">
              <div className="relative flex flex-col items-center">
                <motion.div 
                  animate={{ scale: [1, 2.5, 1], opacity: [0.6, 0, 0.6] }} 
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }} 
                  className="absolute w-8 h-8 border border-red-500 rounded-full" 
                />
                <div className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_20px_rgba(239,68,68,1)]" />
                <div className="mt-4 text-[10px] text-slate-200 font-bold tracking-widest uppercase bg-[#0a0f1e]/90 px-2 py-1 rounded border border-slate-700 backdrop-blur-sm pointer-events-none">
                  Thulagi Lake
                </div>
              </div>
            </Marker>
          </MapGL>
        </div>
      )}

      {/* ── 3D Map State (React Three Fiber) ── */}
      {is3D && (
        <div className="absolute inset-0 cursor-move z-10">
          {/* FIX: Suspense prevents Vite from crashing during async WebGL load */}
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center w-full h-full text-slate-400">
              <AlertTriangle className="animate-pulse mb-4 text-yellow-500" size={32} />
              <p className="text-sm uppercase tracking-widest">Loading Spatial Geometry...</p>
            </div>
          }>
            <Canvas camera={{ position: [0, 8, 12], fov: 45 }}>
              <ambientLight intensity={0.4} />
              <OrbitControls 
                enableZoom={true} 
                maxPolarAngle={Math.PI / 2.1} 
                minDistance={5} 
                maxDistance={30} 
              />
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
                <planeGeometry args={[80, 80, 32, 32]} />
                <meshBasicMaterial color="#334155" wireframe transparent opacity={0.3} />
              </mesh>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.9, -8]}>
                <circleGeometry args={[2.5, 32]} />
                <meshBasicMaterial color="#1d4ed8" />
              </mesh>
              <FloodParticles />
            </Canvas>
          </Suspense>
          <div className="absolute bottom-5 right-5 text-[10px] text-slate-500 tracking-wider">
            Click & Drag to Rotate
          </div>
        </div>
      )}
    </div>
  );
}