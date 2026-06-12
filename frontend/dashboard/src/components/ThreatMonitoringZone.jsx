/**
 * ThreatMonitoringZone — Phase 5
 * Replaces the static terrain frame with the interactive MapLibre GL JS engine.
 * Coordinates read from selectedLake.coordinates (no hardcoding).
 * Adds mobile collapsible state with expand/collapse toggle.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import useLakeStore from '../store/useLakeStore';
import AlertStatus from './AlertStatus';
import MapContainer from './map/MapContainer';
import LakeMarker from './map/LakeMarker';
import RiskRadius from './map/RiskRadius';
import ImpactRadius from './map/ImpactRadius';
import MapControls from './map/MapControls';
import DigitalTwin from './digitalTwin/DigitalTwin';
import LakeSelector from './LakeSelector';
import FloodSimulation from './simulation/FloodSimulation';

function ThreatMonitoringZone() {
  const selectedLake  = useLakeStore(s => s.selectedLake);
  const riskScore     = useLakeStore(s => s.riskScore);
  const riskTier      = useLakeStore(s => s.riskTier);
  const analysisState = useLakeStore(s => s.analysisState);
  const viewMode      = useLakeStore(s => s.viewMode);

  const [isMapCollapsed, setIsMapCollapsed] = useState(false);

  /* Clamp score — prevents bar overflow on bad data */
  const safeScore = Math.min(Math.max(riskScore, 0), 100);

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

      {/* ── Lake info + AlertStatus ────────────────── */}
      <div className="tmz-lake-info">
        <h2 className="tmz-lake-name">{selectedLake.name}</h2>

        <div className="tmz-lake-meta">
          <span>{selectedLake.lakeId}</span>
          <span className="meta-dot" aria-hidden="true">·</span>
          <span>{lat} · {lng}</span>
        </div>

        <div
          className={`tier-status tier-status--${tierLower}`}
          role="status"
          aria-label={`Risk tier: ${riskTier} — Critical Alert Active`}
        >
          <span className="tier-status__dot" aria-hidden="true" />
          {riskTier} — Critical Alert Active
        </div>

        <AlertStatus />
      </div>

      <div
        className={`tmz-frame ${isMapCollapsed ? 'is-collapsed' : ''}`}
        role="region"
        aria-label={
          viewMode === '2d'
            ? `Geospatial map of ${selectedLake.name}`
            : viewMode === '3d'
            ? `3D Digital Twin of ${selectedLake.name}`
            : `Flood Simulation of ${selectedLake.name}`
        }
      >
        {viewMode === '2d' ? (
          <MapContainer>
            <LakeMarker />
            <RiskRadius />
            <ImpactRadius />
            <MapControls />
          </MapContainer>
        ) : viewMode === '3d' ? (
          <DigitalTwin />
        ) : (
          <FloodSimulation />
        )}
      </div>

      {/* ── Risk tier status bar ───────────────────── */}
      <div className={`tmz-status-bar tmz-status-bar--${tierLower}`}>
        <span className="tmz-status-bar__label">RISK TIER</span>
        <div
          className="tmz-status-bar__track"
          role="progressbar"
          aria-valuenow={safeScore}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Risk score: ${safeScore} out of 100`}
        >
          <div
            className="tmz-status-bar__fill"
            style={{ width: `${safeScore}%` }}
          />
        </div>
        <span className="tmz-status-bar__score">{safeScore}/100</span>
        <span className="tmz-status-bar__tier">{riskTier}</span>
      </div>

    </div>
  );
}

export default ThreatMonitoringZone;

