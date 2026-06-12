import * as THREE from 'three';

// Simple hashing function to generate coordinates offset seed from lakeId
export function getLakeSeedOffsets(lakeId) {
  const safeId = lakeId || 'PDGL_THULAGI_01';
  let hash = 0;
  for (let i = 0; i < safeId.length; i++) {
    hash = safeId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const xOffset = ((hash & 0xFF) / 255.0) * 1.5;
  const yOffset = (((hash >> 8) & 0xFF) / 255.0) * 1.5;
  const scale = 1.0 + (((hash >> 16) & 0xFF) / 255.0) * 0.4;
  return { xOffset, yOffset, scale };
}

// Procedural height mapping function matching TerrainMesh.jsx logic
export function getTerrainHeight(x, z, xOffset, yOffset, scale) {
  const nx = x / 5.0;
  const ny = z / 5.0;
  const dist = Math.sqrt(nx * nx + ny * ny);

  // Base Himalayan topography profile with lake-specific offsets
  let height = 0.4 + 0.22 * Math.sin((nx + xOffset) * Math.PI) * Math.cos((ny + yOffset) * Math.PI);
  height += 0.08 * Math.sin((nx + xOffset * 2) * 8 * scale) * Math.cos((ny + yOffset * 2) * 8 * scale);
  height += 0.03 * Math.sin((nx + xOffset * 3) * 20 * scale) * Math.cos((ny + yOffset * 3) * 20 * scale);

  // Central depression for lake basin (dist < 0.22)
  if (dist < 0.22) {
    const factor = dist / 0.22;
    height = height * factor + 0.12 * (1 - factor);
  } else {
    // Ridgelines and surrounding mountain slopes
    height += 0.24 * (dist - 0.22);
  }

  // Valley outflow channel downwards
  if (ny > 0.2 && Math.abs(nx) < 0.16) {
    const channelFactor = Math.abs(nx) / 0.16;
    const nyFactor = (ny - 0.2) / 0.8;
    const dip = 0.14 * (1 - channelFactor) * nyFactor;
    height -= dip;
  }

  height = Math.max(0, Math.min(1, height));
  return -0.5 + height * 2.6;
}

// Base static path points down the valley (default reference)
export const FLOW_PATH_POINTS = [
  new THREE.Vector3(0, 0.05, 0),        // Lake center
  new THREE.Vector3(0, -0.03, 0.8),     // Outflow gorge
  new THREE.Vector3(0.3, -0.12, 1.8),   // Upper gorge bend
  new THREE.Vector3(0.45, -0.2, 2.4),   // Bridge crossing location
  new THREE.Vector3(-0.4, -0.3, 3.4),   // Canyon bend (road location)
  new THREE.Vector3(-0.25, -0.4, 4.2),  // Downstream plain (hydropower)
  new THREE.Vector3(0.1, -0.46, 4.9)    // Downstream community village
];

export const FLOW_CURVE = new THREE.CatmullRomCurve3(FLOW_PATH_POINTS);

// Generates dynamic path points for a specific lake based on procedural terrain offsets
export function getFlowPathPointsForLake(lakeId) {
  const { xOffset, yOffset, scale } = getLakeSeedOffsets(lakeId);

  const basePoints = [
    new THREE.Vector3(0, 0.05, 0),
    new THREE.Vector3(0, -0.03, 0.8),
    new THREE.Vector3(0.3, -0.12, 1.8),
    new THREE.Vector3(0.45, -0.2, 2.4),
    new THREE.Vector3(-0.4, -0.3, 3.4),
    new THREE.Vector3(-0.25, -0.4, 4.2),
    new THREE.Vector3(0.1, -0.46, 4.9)
  ];

  return basePoints.map((basePt, index) => {
    if (index === 0) {
      return new THREE.Vector3(0, 0.05, 0); // Lake center stays fixed
    }

    const distanceFactor = basePt.z / 4.9; // 0.0 to 1.0 downstream
    const xShift = (xOffset - 0.75) * 0.3 * distanceFactor;
    const zShift = (yOffset - 0.75) * 0.3 * distanceFactor;

    const x = basePt.x + xShift;
    const z = basePt.z + zShift;

    // Get exact height of the terrain at the shifted coordinate
    const terrainY = getTerrainHeight(x, z, xOffset, yOffset, scale);
    const y = terrainY;

    return new THREE.Vector3(x, y, z);
  });
}

// Generates a dynamic CatmullRomCurve3 curve for a specific lake
export function getFlowCurveForLake(lakeId) {
  const points = getFlowPathPointsForLake(lakeId);
  return new THREE.CatmullRomCurve3(points);
}

// Timeline configuration details: time step maps to flow path progress [0.0, 1.0]
export const TIMELINE_STEPS = [
  { time: '0 min',  label: 'Outburst Trigger', maxProgress: 0.08 },
  { time: '5 min',  label: 'Upper Gorge Rushing', maxProgress: 0.35 },
  { time: '15 min', label: 'Infrastructure Alert', maxProgress: 0.65 },
  { time: '30 min', label: 'Valley Inundation', maxProgress: 1.0 }
];

