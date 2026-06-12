import * as THREE from 'three';

// Coordinate path down the displaced procedural Himalayan valley terrain
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

// Timeline configuration details: time step maps to flow path progress [0.0, 1.0]
export const TIMELINE_STEPS = [
  { time: '0 min',  label: 'Outburst Trigger', maxProgress: 0.08 },
  { time: '5 min',  label: 'Upper Gorge Rushing', maxProgress: 0.35 },
  { time: '15 min', label: 'Infrastructure Alert', maxProgress: 0.65 },
  { time: '30 min', label: 'Valley Inundation', maxProgress: 1.0 }
];
