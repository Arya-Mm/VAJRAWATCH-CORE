import { useMemo } from 'react';
import * as THREE from 'three';

// Procedural generator to create grayscale heightmap and colored diffuse map
function generateTerrainTextures() {
  const size = 256;

  // 1. Grayscale Displacement Heightmap Canvas
  const dispCanvas = document.createElement('canvas');
  dispCanvas.width = size;
  dispCanvas.height = size;
  const dispCtx = dispCanvas.getContext('2d');
  const dispImg = dispCtx.createImageData(size, size);

  // 2. Diffuse Color Map Canvas
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const colorCtx = colorCanvas.getContext('2d');
  const colorImg = colorCtx.createImageData(size, size);

  const heights = new Float32Array(size * size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x / size) * 2 - 1;
      const ny = (y / size) * 2 - 1;
      const dist = Math.sqrt(nx * nx + ny * ny);

      // Base Himalayan topography profile
      let height = 0.4 + 0.22 * Math.sin(nx * Math.PI) * Math.cos(ny * Math.PI);
      height += 0.08 * Math.sin(nx * 8) * Math.cos(ny * 8);
      height += 0.03 * Math.sin(nx * 20) * Math.cos(ny * 20);

      // Central depression for Thulagi Lake basin (dist < 0.22)
      if (dist < 0.22) {
        const factor = dist / 0.22;
        // Dips down to 0.12 at the center
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
      heights[y * size + x] = height;

      const val = Math.floor(height * 255);
      const idx = (y * size + x) * 4;
      dispImg.data[idx] = val;     // R
      dispImg.data[idx + 1] = val; // G
      dispImg.data[idx + 2] = val; // B
      dispImg.data[idx + 3] = 255; // A
    }
  }
  dispCtx.putImageData(dispImg, 0, 0);

  // Paint Diffuse Colormap based on Height and Slope
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const height = heights[y * size + x];

      // Slope calculations via central difference
      const xPrev = heights[y * size + Math.max(0, x - 1)];
      const xNext = heights[y * size + Math.min(size - 1, x + 1)];
      const yPrev = heights[Math.max(0, y - 1) * size + x];
      const yNext = heights[Math.min(size - 1, y + 1) * size + x];

      const dx = xNext - xPrev;
      const dy = yNext - yPrev;
      const slope = Math.sqrt(dx * dx + dy * dy) * 14;

      let r, g, b; // Base valley rock / gravel

      if (height < 0.22) {
        // Deep lake bed
        r = 12; g = 18; b = 28;
      } else if (height < 0.35) {
        // Low vegetation / grass
        r = 28; g = 44; b = 38;
      } else if (height < 0.6) {
        // High steep slate rock
        r = 60; g = 64; b = 72;
      } else {
        // High glaciers / snow
        r = 224; g = 230; b = 242;
      }

      // Highlight unstable slope profiles with warning colors
      if (slope > 0.45 && height >= 0.22) {
        const blend = Math.min(1, (slope - 0.45) * 2.5);
        r = Math.floor(r * (1 - blend) + 160 * blend);
        g = Math.floor(g * (1 - blend) + 70 * blend);
        b = Math.floor(b * (1 - blend) + 40 * blend);
      }

      const idx = (y * size + x) * 4;
      colorImg.data[idx] = r;
      colorImg.data[idx + 1] = g;
      colorImg.data[idx + 2] = b;
      colorImg.data[idx + 3] = 255;
    }
  }
  colorCtx.putImageData(colorImg, 0, 0);

  return { dispCanvas, colorCanvas };
}

export default function TerrainMesh() {
  const { dispCanvas, colorCanvas } = useMemo(() => generateTerrainTextures(), []);

  const dispTexture = useMemo(() => {
    const tex = new THREE.CanvasTexture(dispCanvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, [dispCanvas]);

  const colorTexture = useMemo(() => {
    const tex = new THREE.CanvasTexture(colorCanvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, [colorCanvas]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.5, 0]}>
      <planeGeometry args={[10, 10, 128, 128]} />
      <meshStandardMaterial
        map={colorTexture}
        displacementMap={dispTexture}
        displacementScale={2.6}
        displacementBias={0}
        roughness={0.85}
        metalness={0.1}
      />
    </mesh>
  );
}
