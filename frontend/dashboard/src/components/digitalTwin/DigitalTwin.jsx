import { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import useLakeStore from '../../store/useLakeStore';
import TerrainMesh from './TerrainMesh';
import LakeMesh from './LakeMesh';
import RiskOverlay from './RiskOverlay';
import CameraController from './CameraController';

function ZoomController() {
  const { camera, controls } = useThree();
  const zoom3DClick = useLakeStore((s) => s.zoom3DClick);

  useEffect(() => {
    if (!zoom3DClick) return;
    const { action } = zoom3DClick;
    const factor = action === 'in' ? 0.75 : 1.33;

    if (controls) {
      const target = controls.target;
      const offset = new THREE.Vector3().subVectors(camera.position, target);
      offset.multiplyScalar(factor);
      camera.position.addVectors(target, offset);
      controls.update();
    } else {
      camera.position.multiplyScalar(factor);
    }
  }, [zoom3DClick, camera, controls]);

  return null;
}

export default function DigitalTwin() {
  const viewMode = useLakeStore((s) => s.viewMode);
  const setViewMode = useLakeStore((s) => s.setViewMode);
  const trigger3DReset = useLakeStore((s) => s.trigger3DReset);
  const zoom3D = useLakeStore((s) => s.zoom3D);

  return (
    <div className="digital-twin-container">
      {/* 3D Render Canvas */}
      <Canvas
        shadows
        camera={{ position: [0, 8, 12], fov: 45 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        {/* Deep navy space ambient color */}
        <color attach="background" args={['#040815']} />

        {/* Ambient light for basic valley fill */}
        <ambientLight intensity={0.55} />

        {/* Tactical glowing hazard pointlight at lake center */}
        <pointLight
          position={[0, 0.5, 0]}
          intensity={2.0}
          distance={5}
          color="#ef4444"
        />

        {/* Directional light representing high altitude sunlight */}
        <directionalLight
          position={[5, 12, 6]}
          intensity={1.5}
          color="#f1f5f9"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        {/* Digital Twin Submeshes */}
        <TerrainMesh />
        <LakeMesh />
        <RiskOverlay />

        {/* Camera HUD Action handlers */}
        <CameraController />
        <ZoomController />

        {/* Orbit Control constraints to prevent going beneath the valley floor */}
        <OrbitControls
          makeDefault
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={3}
          maxDistance={25}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>

      {/* 1. Map Modes HUD Toggle (Top-Left) */}
      <div className="map-modes-toggle" role="group" aria-label="Map Mode">
        <button
          type="button"
          className={`mode-btn ${viewMode === '2d' ? 'active' : ''}`}
          onClick={() => setViewMode('2d')}
        >
          2D MAP
        </button>
        <button
          type="button"
          className={`mode-btn ${viewMode === '3d' ? 'active' : ''}`}
          onClick={() => setViewMode('3d')}
        >
          3D DIGITAL TWIN
        </button>
        <button
          type="button"
          className={`mode-btn ${viewMode === 'simulation' ? 'active' : ''}`}
          onClick={() => setViewMode('simulation')}
          aria-label="Flood Simulation"
        >
          FLOOD SIMULATION
        </button>
      </div>

      {/* 2. Map Control HUD Panel (Top-Right) */}
      <div className="map-controls-panel">
        <button
          type="button"
          className="control-btn"
          onClick={() => zoom3D('in')}
          title="Zoom In"
          aria-label="Zoom In"
        >
          ＋
        </button>
        <button
          type="button"
          className="control-btn"
          onClick={() => zoom3D('out')}
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          －
        </button>
        <button
          type="button"
          className="control-btn control-btn--reset"
          onClick={trigger3DReset}
          title="Reset View"
          aria-label="Reset View"
        >
          ⟲ <span className="control-btn-label">RESET</span>
        </button>
      </div>
    </div>
  );
}
