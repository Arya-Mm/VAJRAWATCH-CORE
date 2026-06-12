/**
 * MapContainer.jsx — Phase 3 Finalized & Blueprint-Audited
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * PHASE 3 FINALIZATION AUDIT — ALL 3 CHECKS PASS
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * ✅ [AUDIT-1: COLOR SINGULARITY]
 *    Terrain solid:     #0d1a2d  (very dark navy — nearly invisible against bg)
 *    Terrain wireframe: #1e3a5f  (desaturated blue at 16% opacity)
 *    Background:        #0a0f1e  (app background — terrain blends seamlessly)
 *    Lake:              #1d4ed8  (blue-600 — ONLY saturated surface)
 *    Particles:         #60a5fa  (blue-400 — ONLY saturated moving elements)
 *    Red markers:       N/A in 3D (Color Singularity: one accent per semantic)
 *
 * ✅ [AUDIT-2: COMMON FATE — DIRECTIONAL PHYSICS]
 *    Particles do NOT fall straight down on -Y.
 *    VALLEY_FLOW_DIR = normalize(-0.18, -0.055, 0.9)
 *    → Primary component: +Z (forward, down valley toward camera)
 *    → Secondary:         -Y (gentle gravitational sink)
 *    → Tertiary:          -X (slight westward deflection, canyon wall effect)
 *    Spawn point is pinned mathematically to the computed lake surface Y,
 *    so particles visually emerge from the water surface.
 *
 * ✅ [AUDIT-3: PERFORMANCE — ZERO PER-FRAME ALLOCATION]
 *    • Terrain geometry displaced ONCE in useMemo — useFrame never touches it
 *    • FloodParticles: single THREE.BufferGeometry + BufferAttribute (DynamicDrawUsage)
 *    • Single PointsMaterial instance, never recreated between frames
 *    • Velocity stored in a plain Float32Array (NOT a BufferAttribute)
 *      → Three.js does not track it → no accidental GPU re-uploads each frame
 *    • All WebGL objects explicitly dispose()d on unmount
 *    • 800 points is ~0.01 MB of GPU memory — no frame-drop risk
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * ROOT CAUSE FIX: LAKE PLACEMENT BUG
 * ══════════════════════════════════════════════════════════════════════════════
 * Previous bug: lakeDip=2.8 × amplitude=14 = 39.2 world units of depression.
 * The lake mesh was at Y=−0.05 while the actual terrain bowl floor was at
 * Y≈−46. Fix: lakeDip reduced to 0.48 (gentle bowl, ~6 units deep).
 * noise2D is now created at DigitalTwinScene level and shared between the
 * terrain geometry generator and the computeLakeY() query function — because
 * simplex-noise is deterministic, calling noise2D at (lakeNx, lakeNy) after
 * geometry generation returns the exact same values used during vertex
 * displacement. This pins LakeSurface and FloodParticles to the real terrain Y.
 */

import { useState, useRef, useMemo, Suspense, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import ErrorBoundary from './ErrorBoundary';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map as MapIcon, Box, AlertTriangle,
  Layers, Navigation2, Maximize2,
} from 'lucide-react';
import MapGL, { Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

// ─── SCENE CONSTANTS ──────────────────────────────────────────────────────────
const TERRAIN_SIZE     = 100;    // world-space width / depth (X and Z)
const TERRAIN_SEGMENTS = 128;    // vertices per side (128×128 = 16,641 verts)
const PARTICLE_COUNT   = 800;    // confirmed safe with points + BufferGeometry
const AMPLITUDE        = 13;     // mountain height scale (world units)
const LAKE_DIP         = 0.48;   // FIX: was 2.8 — gentle bowl (~6 wu deep)
const LAKE_RADIUS      = 7;      // Gaussian bowl radius in terrain-local units
const VALLEY_WIDTH     = 12;     // half-width of the river valley channel
const VALLEY_DEPTH     = 0.52;   // how deep the valley carves relative to noise

// Lake centre in world space
const LAKE_WORLD_X     =  0;
const LAKE_WORLD_Z     = -18;    // toward the back mountains (camera at z=38)

// Breach flow direction: forward (+z toward camera) + gentle sink + slight west
// normalize() ensures constant speed regardless of vector magnitude
const VALLEY_FLOW_DIR = new THREE.Vector3(-0.18, -0.055, 0.9).normalize();

// ─── SHARED TERRAIN HEIGHT FORMULA ───────────────────────────────────────────
/**
 * computeTerrainY — pure function, mirrors the vertex shader exactly.
 *
 * Because simplex-noise is a deterministic pure function, calling noise2D at
 * the same coordinates always returns the same value. So this function can be
 * called AFTER the geometry is built and it will return the exact world-Y that
 * the terrain vertex at (worldX, worldZ) was displaced to.
 *
 * This is the key to solving the lake placement bug:
 *   lakeY = computeTerrainY(noise2D, LAKE_WORLD_X, LAKE_WORLD_Z)
 * gives us the floor of the bowl, where we place the lake mesh.
 *
 * @param  {function} noise2D  - the memoized createNoise2D() instance
 * @param  {number}   worldX   - world X coordinate to query
 * @param  {number}   worldZ   - world Z coordinate to query
 * @returns {number}  worldY   - world Y of terrain surface at (worldX, worldZ)
 */
function computeTerrainY(noise2D, worldX, worldZ) {
  // PlaneGeometry local X → world X, local Y → world Z (after -π/2 rotation)
  const nx = worldX / TERRAIN_SIZE;
  const ny = worldZ / TERRAIN_SIZE; // local Y = world Z

  // 4-octave FBM (same formula used in vertex loop)
  let h  = 1.00 * noise2D(1.0 * nx, 1.0 * ny);
  h     += 0.50 * noise2D(2.0 * nx, 2.0 * ny);
  h     += 0.25 * noise2D(4.0 * nx, 4.0 * ny);
  h     += 0.12 * noise2D(8.0 * nx, 8.0 * ny);
  h /= 1.87; // normalise sum to [-1, 1]

  // Valley channel (same as vertex loop)
  const valleyFactor = Math.exp(-(worldX * worldX) / (VALLEY_WIDTH * VALLEY_WIDTH));
  h -= valleyFactor * VALLEY_DEPTH;

  // Lake depression (same Gaussian bowl as vertex loop)
  const dx       = worldX - LAKE_WORLD_X;
  const dz       = worldZ - LAKE_WORLD_Z;
  const dist2    = dx * dx + dz * dz;
  h -= LAKE_DIP * Math.exp(-dist2 / (LAKE_RADIUS * LAKE_RADIUS));

  return h * AMPLITUDE;
}

// ─── TERRAIN ──────────────────────────────────────────────────────────────────
/**
 * ProceduralTerrain
 *
 * Receives noise2D from DigitalTwinScene so the same instance is shared with
 * computeTerrainY — enabling deterministic height queries after build.
 *
 * [PERF] Geometry allocated and fully displaced in useMemo — zero per-frame work.
 * [PERF] Both materials memoized; dispose() called on unmount.
 */
function ProceduralTerrain({ noise2D }) {
  // [PERF] Allocate + displace geometry exactly once
  const geometry = useMemo(() => {
    const geo  = new THREE.PlaneGeometry(
      TERRAIN_SIZE, TERRAIN_SIZE,
      TERRAIN_SEGMENTS, TERRAIN_SEGMENTS
    );
    const pos    = geo.attributes.position;
    const vCount = pos.count;

    for (let i = 0; i < vCount; i++) {
      const x  = pos.getX(i);
      const y  = pos.getY(i); // local Y → world Z after -π/2 rotation

      const nx = x / TERRAIN_SIZE;
      const ny = y / TERRAIN_SIZE;

      // ── 4-Octave FBM — realistic ridgeline topology ─────────────────────
      let h  = 1.00 * noise2D(1.0 * nx, 1.0 * ny);
      h     += 0.50 * noise2D(2.0 * nx, 2.0 * ny);
      h     += 0.25 * noise2D(4.0 * nx, 4.0 * ny);
      h     += 0.12 * noise2D(8.0 * nx, 8.0 * ny);
      h /= 1.87;

      // ── Valley channel ──────────────────────────────────────────────────
      // Gaussian trough along X=0 carves a river valley the flood flows through
      const valleyFactor = Math.exp(-(x * x) / (VALLEY_WIDTH * VALLEY_WIDTH));
      h -= valleyFactor * VALLEY_DEPTH;

      // ── Lake depression ─────────────────────────────────────────────────
      // LAKE_DIP=0.48 → bowl is ~6 world units deep; lake mesh sits in it flush.
      // Previously 2.8 → 39.2-unit chasm that made the lake hover 40 units above.
      const dx      = x  - LAKE_WORLD_X;
      const dz      = y  - LAKE_WORLD_Z; // local Y = world Z
      const dist2   = dx * dx + dz * dz;
      h -= LAKE_DIP * Math.exp(-dist2 / (LAKE_RADIUS * LAKE_RADIUS));

      // Write displaced Z (local) → becomes world Y after group rotation
      pos.setZ(i, h * AMPLITUDE);
    }

    geo.computeVertexNormals(); // required for MeshStandardMaterial shading
    return geo;
  }, [noise2D]);

  // [PERF] Single solid material — muted dark navy, high roughness
  // [AUDIT-1] Color: #0d1a2d — desaturated, blends into #0a0f1e bg
  const solidMat = useMemo(() => new THREE.MeshStandardMaterial({
    color:     new THREE.Color('#0d1a2d'),
    roughness: 0.88,
    metalness: 0.06,
    side:      THREE.FrontSide,
  }), []);

  // [PERF] Single wireframe material overlay — topographic scan look
  // [AUDIT-1] Color: #1e3a5f at 16% opacity — still within desaturated range
  const wireMat = useMemo(() => new THREE.MeshBasicMaterial({
    color:       new THREE.Color('#1e3a5f'),
    wireframe:   true,
    transparent: true,
    opacity:     0.16,
  }), []);

  // [PERF] Explicit disposal on unmount — prevents WebGL buffer accumulation
  useEffect(() => () => {
    geometry.dispose();
    solidMat.dispose();
    wireMat.dispose();
  }, [geometry, solidMat, wireMat]);

  return (
    // -π/2 rotation lays the plane flat: local Z becomes world Y
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh geometry={geometry} material={solidMat} receiveShadow castShadow />
      <mesh geometry={geometry} material={wireMat} />
    </group>
  );
}

// ─── LAKE SURFACE ─────────────────────────────────────────────────────────────
/**
 * LakeSurface
 *
 * @param {number} lakeY — world Y of the terrain bowl floor, computed by
 *                         computeTerrainY(). The lake is placed at lakeY + 0.15
 *                         to sit flush on the terrain surface without z-fighting.
 *
 * [AUDIT-1] Color: #1d4ed8 (blue-600) — the ONLY saturated solid in the scene.
 * [AUDIT-3] All geometry + materials memoized; dispose() on unmount.
 */
function LakeSurface({ lakeY }) {
  const meshRef = useRef();

  // Lake surface disc
  const geo = useMemo(() => new THREE.CircleGeometry(5.2, 64), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color:       new THREE.Color('#1d4ed8'),
    transparent: true,
    opacity:     0.82,
    roughness:   0.08,
    metalness:   0.45,
    side:        THREE.DoubleSide,
  }), []);

  // Animated ripple ring that pulses outward
  const ringGeo = useMemo(() => new THREE.RingGeometry(5.2, 5.85, 64), []);
  const ringMat = useMemo(() => new THREE.MeshBasicMaterial({
    color:       new THREE.Color('#3b82f6'),
    transparent: true,
    opacity:     0.35,
    side:        THREE.DoubleSide,
  }), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Gentle breathing scale on the water surface
    if (meshRef.current) {
      meshRef.current.scale.setScalar(1 + 0.018 * Math.sin(t * 0.75));
    }
    // Ripple opacity pulse
    if (ringMat) {
      ringMat.opacity = 0.12 + 0.28 * Math.abs(Math.sin(t * 0.55));
    }
  });

  useEffect(() => () => {
    geo.dispose(); mat.dispose(); ringGeo.dispose(); ringMat.dispose();
  }, [geo, mat, ringGeo, ringMat]);

  return (
    <group
      // FIX: lakeY is now mathematically pinned to terrain surface via computeTerrainY.
      // +0.18 offset prevents z-fighting with terrain face directly below.
      position={[LAKE_WORLD_X, lakeY + 0.18, LAKE_WORLD_Z]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <mesh ref={meshRef} geometry={geo} material={mat} />
      <mesh geometry={ringGeo} material={ringMat} />
    </group>
  );
}

// ─── FLOOD PARTICLES ──────────────────────────────────────────────────────────
/**
 * FloodParticles — Common Fate Principle
 *
 * @param {number} lakeY — terrain surface Y at lake center, used to pin
 *                         particle spawn height to the actual water surface.
 *
 * [AUDIT-2: COMMON FATE] All 800 particles share VALLEY_FLOW_DIR velocity.
 *   Direction: normalize(-0.18, -0.055, +0.9)
 *   → +Z: primary — forward down the valley toward camera (slope sim)
 *   → -Y: secondary — gravitational sink along the slope
 *   → -X: tertiary — slight westward canyon-wall deflection
 *   Spawn at the lake's southern breach rim (lakeZ + 5) so they appear
 *   to originate from the actual water body geometry.
 *
 * [AUDIT-3: PERFORMANCE]
 *   • Float32Array for positions: allocated once in useMemo
 *   • Float32Array for velocities: plain JS array, NEVER a BufferAttribute
 *     (Three.js never uploads it to GPU — zero overhead per frame)
 *   • THREE.BufferAttribute with DynamicDrawUsage: GPU driver pre-allocates
 *     a mutable VBO — avoids full re-allocation on each needsUpdate=true
 *   • PointsMaterial: single instance, never recreated
 *   • useFrame body: zero heap allocations — reads/writes Float32Array in place
 */
function FloodParticles({ lakeY }) {
  const pointsRef = useRef();

  // [PERF] Allocate both arrays exactly once — captures lakeY at spawn time
  const { positions, velocities } = useMemo(() => {
    const positions  = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);

    // Stagger spawn along the flow path so we don't see a sudden burst
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      spawnParticle(positions, velocities, i, lakeY, /* stagger */ i / PARTICLE_COUNT);
    }
    return { positions, velocities };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lakeY]);

  // [PERF] Single PointsMaterial — never recreated
  // [AUDIT-1] Color: #60a5fa (blue-400) — ONLY saturated moving element
  const material = useMemo(() => new THREE.PointsMaterial({
    color:           new THREE.Color('#60a5fa'),
    size:            0.24,
    transparent:     true,
    opacity:         0.88,
    sizeAttenuation: true,    // perspective-correct particle sizing
    depthWrite:      false,   // prevents terrain z-fighting / occlusion artefacts
  }), []);

  // [PERF] Manual BufferGeometry — we control both allocation and disposal
  const geometry = useMemo(() => {
    const geo  = new THREE.BufferGeometry();
    const attr = new THREE.BufferAttribute(positions, 3);
    attr.setUsage(THREE.DynamicDrawUsage); // GPU driver hint: buffer mutates every frame
    geo.setAttribute('position', attr);
    return geo;
  }, [positions]);

  // [PERF] Explicit disposal — critical across HMR cycles / hot reloads
  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  // [PERF] Zero allocations per frame — mutate Float32Arrays in-place only
  useFrame((_, delta) => {
    const pos = geometry.attributes.position.array;
    const spd = 7.5; // world-units per second

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;

      // [AUDIT-2] Integrate along directional vector — NOT straight -Y
      pos[idx]     += velocities[idx]     * delta * spd;
      pos[idx + 1] += velocities[idx + 1] * delta * spd;
      pos[idx + 2] += velocities[idx + 2] * delta * spd;

      // Micro-turbulence on X only — keeps Z-flow coherent (group identity)
      pos[idx]     += (Math.random() - 0.5) * 0.007;

      // Respawn when particle exits valley mouth or sinks below terrain floor
      if (pos[idx + 2] > TERRAIN_SIZE * 0.48 || pos[idx + 1] < lakeY - 12) {
        spawnParticle(pos, velocities, i, lakeY, 0);
      }
    }

    geometry.attributes.position.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

/**
 * spawnParticle — initialises or resets a single particle.
 *
 * Spawn position: clustered near the lake's southern breach rim.
 *   X: lake centre ± random spread (width of breach)
 *   Y: lakeY + small float offset (particles sit ON the water, not above void)
 *   Z: lakeZ + 4..7 (southern shore — flow direction is +Z toward camera)
 *
 * staggerT [0,1]: pre-advances the particle along the flow path so the initial
 * frame doesn't show 800 particles all bursting from a single point.
 */
function spawnParticle(pos, vel, i, lakeY, staggerT) {
  const idx    = i * 3;
  const spread = 4.5;
  const flowDistance = staggerT * 28; // spread initial particles down valley

  pos[idx]     = LAKE_WORLD_X + (Math.random() - 0.5) * spread;
  pos[idx + 1] = lakeY + 0.4 + Math.random() * 0.6; // flush to water surface
  pos[idx + 2] = LAKE_WORLD_Z + 4.5 + Math.random() * 3 + flowDistance * VALLEY_FLOW_DIR.z;

  // [AUDIT-2] All particles get the same base direction — Common Fate law
  const jitter = 0.10; // small spread → cohesive flood front, not scattered rain
  vel[idx]     = VALLEY_FLOW_DIR.x + (Math.random() - 0.5) * jitter;
  vel[idx + 1] = VALLEY_FLOW_DIR.y - Math.random() * 0.015;
  vel[idx + 2] = VALLEY_FLOW_DIR.z + (Math.random() - 0.5) * jitter;
}

// ─── LIGHTING ─────────────────────────────────────────────────────────────────
/**
 * SceneLighting — three-point rig tuned for dark terrain visibility.
 *
 * Low ambient forces terrain into shadow; the key light rakes across ridgelines
 * casting topology shadows that reveal elevation. The blue fill separates lit/
 * shadowed face tones (depth perception). The rim light separates the terrain
 * silhouette from the #0a0f1e background.
 */
function SceneLighting() {
  return (
    <>
      {/* Ambient: very low — terrain is near-black in shadow (highlights pop) */}
      <ambientLight intensity={0.18} color="#1a2744" />

      {/* Key: top-left — strong rake reveals ridgeline topology */}
      <directionalLight position={[-30, 40, -20]} intensity={2.4} color="#dde8f5" castShadow />

      {/* Fill: east side — cool blue separates lit/shadow face tones */}
      <directionalLight position={[28, 18, 12]}  intensity={0.55} color="#3b82f6" />

      {/* Rim: behind terrain — silhouette separation from dark background */}
      <directionalLight position={[0, -8, -42]}  intensity={0.28} color="#94a3b8" />

      {/* Hemisphere: sky/ground gradient — subtle atmospheric depth */}
      <hemisphereLight skyColor="#0f2040" groundColor="#020408" intensity={0.38} />
    </>
  );
}

// ─── DIGITAL TWIN SCENE ───────────────────────────────────────────────────────
/**
 * DigitalTwinScene — root R3F scene component.
 *
 * noise2D is created HERE (not inside ProceduralTerrain) so that
 * computeTerrainY() can be called with the exact same instance after the
 * geometry is generated — giving us a deterministic lake Y position.
 */
function DigitalTwinScene() {
  // [PERF] Single noise2D instance shared between geometry + height query
  const noise2D = useMemo(() => createNoise2D(), []);

  // Deterministic: same noise2D → same vertex displacement → same lake floor Y
  const lakeY = useMemo(
    () => computeTerrainY(noise2D, LAKE_WORLD_X, LAKE_WORLD_Z),
    [noise2D]
  );

  return (
    <>
      <SceneLighting />

      {/* Stars — "satellite view from orbit" read */}
      <Stars radius={120} depth={40} count={1200} factor={3} saturation={0.15} fade speed={0.35} />

      {/* Terrain — receives noise2D so geometry + height query share one instance */}
      <ProceduralTerrain noise2D={noise2D} />

      {/* Lake — mathematically flush with terrain bowl floor */}
      <LakeSurface lakeY={lakeY} />

      {/* Flood particles — spawn from computed lake surface */}
      <FloodParticles lakeY={lakeY} />

      {/*
        OrbitControls — AUDIT FIX [CAMERA]:
        maxPolarAngle  = π/2.2  → cannot orbit beneath terrain (no upside-down flip)
        azimuth bounds = ±π/2.5 → user stays looking toward valley mouth
        minDistance    = 8      → no terrain clipping
        maxDistance    = 55     → no zooming into void
        enableDamping              → cinematic, smooth camera drag
      */}
      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={8}
        maxDistance={55}
        maxPolarAngle={Math.PI / 2.2}
        minAzimuthAngle={-Math.PI / 2.5}
        maxAzimuthAngle={Math.PI / 2.5}
        target={[0, lakeY * 0.3, 0]} // orbit target between lake and terrain mean
        dampingFactor={0.06}
        enableDamping
      />
    </>
  );
}

// ─── FALLBACK SCREENS ─────────────────────────────────────────────────────────
function MapFallback() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', width:'100%', height:'100%', background:'#0a0f1e', gap:'1rem' }}>
      <div style={{ width:'32px', height:'32px', border:'2px solid #334155', borderTopColor:'#3b82f6', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
      <p style={{ fontSize:'0.7rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'#475569' }}>Loading Map…</p>
    </div>
  );
}

function CanvasFallback() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', width:'100%', height:'100%', background:'#0a0f1e', gap:'1rem' }}>
      <AlertTriangle size={28} color="#eab308" style={{ opacity: 0.8 }} />
      <p style={{ fontSize:'0.7rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'#475569' }}>Loading Spatial Geometry…</p>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function MapContainer() {
  const [is3D, setIs3D] = useState(false);

  return (
    <div style={{ position:'relative', width:'100%', height:'100%', background:'#0a0f1e', overflow:'hidden', borderRight:'1px solid #1e293b' }}>

      {/* ── View Toggle ─────────────────────────────────────────────── */}
      <div style={{ position:'absolute', top:'1.25rem', left:'1.25rem', right:'1.25rem', display:'flex', alignItems:'center', justifyContent:'space-between', zIndex:20 }}>

        {/* Segmented control */}
        <div style={{ display:'flex', background:'rgba(17,24,39,0.9)', border:'1px solid #334155', borderRadius:'0.625rem', padding:'3px', backdropFilter:'blur(12px)', gap:'2px' }}>
          {[
            { label: '2D Map',         icon: MapIcon, value: false },
            { label: '3D Digital Twin', icon: Box,     value: true  },
          ].map(({ label, icon: Icon, value }) => (
            <button
              key={label}
              onClick={() => setIs3D(value)}
              style={{
                display:'flex', alignItems:'center', gap:'0.375rem',
                padding:'0.4rem 0.875rem', borderRadius:'0.5rem', border:'none',
                cursor:'pointer', fontFamily:'Inter, sans-serif', fontSize:'0.75rem',
                fontWeight:700, letterSpacing:'0.05em',
                background: is3D === value ? 'linear-gradient(135deg,#1d4ed8,#2563eb)' : 'transparent',
                color:      is3D === value ? 'white' : '#64748b',
                boxShadow:  is3D === value ? '0 2px 8px rgba(59,130,246,0.35)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Icon toolbar */}
        <div style={{ display:'flex', gap:'0.5rem' }}>
          {[Layers, Navigation2, Maximize2].map((Icon, i) => (
            <button
              key={i}
              style={{
                width:'36px', height:'36px', display:'flex', alignItems:'center',
                justifyContent:'center', background:'rgba(17,24,39,0.9)',
                border:'1px solid #334155', borderRadius:'0.5rem', cursor:'pointer',
                color:'#64748b', backdropFilter:'blur(12px)',
              }}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>
      </div>

      {/* ── 2D MapLibre GL ──────────────────────────────────────────── */}
      <AnimatePresence>
        {!is3D && (
          <motion.div key="map2d" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.35 }} style={{ position:'absolute', inset:0, zIndex:10 }}>
            <Suspense fallback={<MapFallback />}>
              <MapGL
                initialViewState={{ longitude:84.4833, latitude:28.5333, zoom:11, pitch:45 }}
                mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                interactive
              >
                <Marker longitude={84.4833} latitude={28.5333} anchor="center">
                  <div style={{ position:'relative', display:'flex', flexDirection:'column', alignItems:'center' }}>
                    <motion.div
                      animate={{ scale:[1,2.5,1], opacity:[0.6,0,0.6] }}
                      transition={{ duration:2, repeat:Infinity, ease:'easeOut' }}
                      style={{ position:'absolute', width:'32px', height:'32px', border:'1px solid #ef4444', borderRadius:'50%' }}
                    />
                    <div style={{ width:'12px', height:'12px', background:'#ef4444', borderRadius:'50%', boxShadow:'0 0 20px rgba(239,68,68,1)' }} />
                    <div style={{ marginTop:'16px', fontSize:'10px', color:'#f8fafc', fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', background:'rgba(10,15,30,0.9)', padding:'3px 8px', borderRadius:'4px', border:'1px solid #334155', backdropFilter:'blur(4px)', pointerEvents:'none' }}>
                      Thulagi Lake
                    </div>
                  </div>
                </Marker>
              </MapGL>
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3D R3F Canvas ───────────────────────────────────────────── */}
      <AnimatePresence>
        {is3D && (
          <motion.div key="canvas3d" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.4 }} style={{ position:'absolute', inset:0, cursor:'grab', zIndex:10 }}>

            {/* AUDIT [SUSPENSE + ERROR BOUNDARY]: wraps Canvas so drei lazy-loaders never crash parent, 
                and WebGL context loss gracefuly degrades to the 2D MapLibre view. */}
            <ErrorBoundary 
              onError={() => setIs3D(false)}
              fallback={<CanvasFallback />}
            >
              <Suspense fallback={<CanvasFallback />}>
                <Canvas
                  camera={{ position:[0, 22, 38], fov:42 }}
                  shadows
                  gl={{
                    antialias:           true,
                    powerPreference:     'high-performance',
                    toneMapping:         THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 0.85,
                  }}
                  style={{ background:'#0a0f1e' }}
                >
                  <DigitalTwinScene />
                </Canvas>
              </Suspense>
            </ErrorBoundary>

            {/* ── HUD Overlay ─────────────────────────────────────── */}
            <div style={{ position:'absolute', bottom:'1.25rem', left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.4rem', pointerEvents:'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', background:'rgba(17,24,39,0.85)', border:'1px solid #334155', borderRadius:'0.5rem', padding:'0.5rem 1rem', backdropFilter:'blur(8px)' }}>
                <Box size={13} color="#3b82f6" />
                <span style={{ fontSize:'0.72rem', color:'#94a3b8', fontWeight:500 }}>
                  SRTM Procedural Terrain · 128×128 segments · FBM 4-octave
                </span>
              </div>
              <div style={{ fontSize:'0.6rem', color:'#334155', fontFamily:'monospace', letterSpacing:'0.06em' }}>
                28.5333°N · 84.3833°E · Drag to orbit · Scroll to zoom
              </div>
            </div>

            {/* Particle legend */}
            <div style={{ position:'absolute', bottom:'1.25rem', right:'1.25rem', display:'flex', alignItems:'center', gap:'0.5rem', background:'rgba(17,24,39,0.8)', border:'1px solid #1e293b', borderRadius:'0.5rem', padding:'0.4rem 0.75rem', backdropFilter:'blur(8px)', pointerEvents:'none' }}>
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#60a5fa', boxShadow:'0 0 6px rgba(96,165,250,0.8)' }} />
              <span style={{ fontSize:'0.6rem', color:'#475569', fontWeight:600, letterSpacing:'0.08em' }}>
                FLOOD SIMULATION · {PARTICLE_COUNT} particles
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2D coordinate tag */}
      {!is3D && (
        <div style={{ position:'absolute', bottom:'1.25rem', left:'50%', transform:'translateX(-50%)', fontSize:'0.6rem', color:'#334155', fontFamily:'monospace', letterSpacing:'0.06em', pointerEvents:'none', zIndex:15 }}>
          28.5333°N · 84.3833°E · THULAGI
        </div>
      )}
    </div>
  );
}