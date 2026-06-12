/**
 * ThreatMonitoringZone — Phase 5
 * Replaces the static terrain frame with the interactive MapLibre GL JS engine.
 * Coordinates read from selectedLake.coordinates (no hardcoding).
 * Adds mobile collapsible state with expand/collapse toggle.
 */import { useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import useLakeStore from '../store/useLakeStore';
import LakeSelector from './LakeSelector';
import RunAnalysisButton from './RunAnalysisButton';
import DemoMode from './DemoMode';

const MapContainer = lazy(() => import('./map/MapContainer'));
const DigitalTwin = lazy(() => import('./digitalTwin/DigitalTwin'));

function ThreatMonitoringZone() {
  const selectedLake  = useLakeStore(s => s.selectedLake);
  const riskTier      = useLakeStore(s => s.riskTier);
  const analysisState = useLakeStore(s => s.analysisState);
  const viewMode      = useLakeStore(s => s.viewMode);

  const [isMapCollapsed, setIsMapCollapsed] = useState(false);

  const tierLower  = riskTier.toLowerCase();
  const isScanning = analysisState === 'loading';

  /* Coordinates from data layer — no hardcoding */
  const { lat, lng } = selectedLake.coordinates ?? {
    lat: 'N/A', lng: 'N/A',
  };

  return (
    <div className="tmz">

      {/* ── Top bar ───────────────────────────────── */}
      <div className="tmz-topbar">
        <span className="tmz-topbar__title">Threat Monitoring Zone</span>
        <div className="tmz-topbar__controls">
          <RunAnalysisButton />
          <div className="tmz-demo-pill">
            <span className="demo-pill-label">AUTO:</span>
            <DemoMode />
          </div>
          <span className="control-sep">|</span>
          <LakeSelector />
          
          {/* Collapse button — only visible on mobile/tablet via CSS */}
          <button
            type="button"
            className="tmz-collapse-btn"
            onClick={() => setIsMapCollapsed(!isMapCollapsed)}
            aria-label={isMapCollapsed ? 'Expand Map' : 'Collapse Map'}
            aria-expanded={!isMapCollapsed}
          >
            {isMapCollapsed ? '▼ EXPAND MAP' : '▲ COLLAPSE MAP'}
          </button>

          <div
            className="tmz-topbar__status"
            role="status"
            aria-label={isScanning ? 'Status: Scanning' : 'Status: Active monitoring'}
          >
            <motion.span
              className="tmz-status-dot"
              animate={{ opacity: [1, 0.25, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden="true"
            />
            <span className="tmz-status-label">
              {isScanning ? 'SCANNING' : 'ACTIVE'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Lake info ────────────────── */}
      <div className="tmz-lake-info">
        <div className="tmz-lake-header-row">
          <h2 className="tmz-lake-name">{selectedLake.name}</h2>
          <span className={`tmz-lake-tier-badge tier-badge--${tierLower}`}>
            ● {riskTier}
          </span>
        </div>

        <div className="tmz-lake-meta">
          <span>{selectedLake.lakeId}</span>
          <span className="meta-dot" aria-hidden="true">·</span>
          <span>{lat} · {lng}</span>
        </div>
      </div>

      <div
        className={`tmz-frame ${isMapCollapsed ? 'is-collapsed' : ''}`}
        role="region"
        aria-label={`GLOF viewport for ${selectedLake.name}`}
      >
        {/* 2D Map Viewport (Permanently Mounted) */}
        <div className={`tmz-viewport-2d ${viewMode !== '2d' ? 'is-hidden' : ''}`} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
          <Suspense fallback={<div className="tmz-loading">LOADING GEOSPATIAL MAP...</div>}>
            <MapContainer />
          </Suspense>
        </div>

        {/* 3D/Simulation Shared Viewport (Permanently Mounted) */}
        <div className={`tmz-viewport-3d ${viewMode === '2d' ? 'is-hidden' : ''}`} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
          <Suspense fallback={<div className="tmz-loading">LOADING DIGITAL TWIN...</div>}>
            <DigitalTwin />
          </Suspense>
        </div>
      </div>

    </div>
  );
}

export default ThreatMonitoringZone;


