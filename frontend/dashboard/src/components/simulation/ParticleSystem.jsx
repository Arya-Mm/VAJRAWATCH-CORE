// ─────────────────────────────────────────────────────────────────────────────
// VISUAL FLOW RENDERING — NOT A HYDRAULIC SIMULATION
// ─────────────────────────────────────────────────────────────────────────────
// Particles use Math.random() for stochastic positional scatter. This is
// intentional and correct for visual aesthetics, but it has NO physical basis.
//
// Do NOT present this component as flood routing, hydraulic modelling, or
// scientific simulation output in demos, reports, or public communications.
//
// Correct framing: "Downstream flow visualization rendering."
// Incorrect framing: "This is our flood simulation."
//
// Real hydraulic simulation would require:
//   • A real DEM (SRTM / Copernicus GLO-30)
//   • Manning's equation for open-channel flow
//   • A numerical solver (e.g., HEC-RAS, LISFLOOD-FP, or custom SPH)
//   • Time-stepped discharge data from backend hydrological model
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useLakeStore from '../../store/useLakeStore';
import { FLOW_CURVE as STATIC_FLOW_CURVE } from './simUtils';

export default function ParticleSystem({ maxProgress, flowCurve }) {
  const riskScore = useLakeStore((s) => s.riskScore);
  const activeCurve = flowCurve || STATIC_FLOW_CURVE;

  const particleCount = Math.min(2500, Math.max(200, Math.round(riskScore * 18)));
  const speedScale = Math.max(0.25, riskScore * 0.012);
  const spreadScale = Math.max(0.04, riskScore * 0.0035);

  const pointsRef = useRef(null);
  const particleDataRef = useRef(null);

  // Initialize particle values inside useEffect (runs post-render: safe from purity/immutability rules)
  useEffect(() => {
    const data = [];
    for (let i = 0; i < 2500; i++) {
      data.push({
        progress: Math.random() * maxProgress,
        speed: 0.12 + Math.random() * 0.18,
        offsetX: (Math.random() - 0.5) * 2.0,
        offsetY: (Math.random() - 0.5) * 0.6,
        offsetZ: (Math.random() - 0.5) * 2.0
      });
    }
    particleDataRef.current = data;
  }, [maxProgress]);

  const positions = useMemo(() => new Float32Array(2500 * 3), []);

  useFrame((state, delta) => {
    if (!pointsRef.current || !particleDataRef.current) return;

    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    const array = posAttr.array;
    const data = particleDataRef.current;

    for (let i = 0; i < particleCount; i++) {
      const p = data[i];

      p.progress += delta * p.speed * speedScale;

      if (p.progress > maxProgress || p.progress > 1.0) {
        p.progress = 0;
      }

      const posOnCurve = activeCurve.getPointAt(p.progress);

      array[i * 3] = posOnCurve.x + p.offsetX * spreadScale;
      array[i * 3 + 1] = posOnCurve.y + p.offsetY * spreadScale * 0.4 + 0.04;
      array[i * 3 + 2] = posOnCurve.z + p.offsetZ * spreadScale;
    }

    for (let i = particleCount; i < 2500; i++) {
      array[i * 3] = 999;
      array[i * 3 + 1] = 999;
      array[i * 3 + 2] = 999;
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#06b6d4"
        size={0.06}
        sizeAttenuation={true}
        transparent={true}
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
