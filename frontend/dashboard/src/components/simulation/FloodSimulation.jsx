import { useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import useLakeStore from '../../store/useLakeStore';
import TerrainMesh from '../digitalTwin/TerrainMesh';
import LakeMesh from '../digitalTwin/LakeMesh';
import CameraController from '../digitalTwin/CameraController';
import FlowPath from './FlowPath';
import ParticleSystem from './ParticleSystem';
import ImpactVisualization from './ImpactVisualization';
import { TIMELINE_STEPS } from './simUtils';

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

export default function FloodSimulation() {
  const viewMode = useLakeStore((s) => s.viewMode);
  const setViewMode = useLakeStore((s) => s.setViewMode);
  const trigger3DReset = useLakeStore((s) => s.trigger3DReset);
  const zoom3D = useLakeStore((s) => s.zoom3D);

  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const activeStep = TIMELINE_STEPS[activeStepIdx];

  return (
    <div className="digital-twin-container simulation-container">
      {/* 3D Render Canvas */}
      <Canvas
        shadows
        camera={{ position: [0, 8, 12], fov: 45 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#040815']} />
        <ambientLight intensity={0.55} />

        {/* Dynamic warning pointlight indicating outburst status */}
        <pointLight
          position={[0, 0.4, 0]}
          intensity={activeStepIdx > 0 ? 3.5 : 1.2}
          distance={6}
          color={activeStepIdx > 0 ? '#ef4444' : '#06b6d4'}
        />

        <directionalLight
          position={[5, 12, 6]}
          intensity={1.4}
          color="#f1f5f9"
          castShadow
        />

        {/* Render base topography meshes */}
        <TerrainMesh />
        <LakeMesh />

        {/* GLOF specific simulation layers */}
        <FlowPath />
        <ParticleSystem maxProgress={activeStep.maxProgress} />
        <ImpactVisualization maxProgress={activeStep.maxProgress} />

        {/* Camera utilities */}
        <CameraController />
        <ZoomController />
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
          aria-pressed={viewMode === 'simulation'}
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

      {/* 3. Bottom HUD GLOF Simulation Timeline (Bottom-Center) */}
      <div className="sim-timeline-panel">
        <div className="sim-timeline-header">
          <span className="sim-timeline-title">GLOF Downstream Impact Simulation</span>
          <span className="sim-timeline-status badge-red">
            {activeStep.label.toUpperCase()}
          </span>
        </div>

        <div className="sim-timeline-steps">
          {TIMELINE_STEPS.map((step, idx) => (
            <button
              key={step.time}
              type="button"
              className={`sim-step-btn ${activeStepIdx === idx ? 'active' : ''}`}
              onClick={() => setActiveStepIdx(idx)}
              aria-label={`Show GLOF status at ${step.time}`}
            >
              <span className="step-btn-time">{step.time}</span>
              <span className="step-btn-label">{step.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
