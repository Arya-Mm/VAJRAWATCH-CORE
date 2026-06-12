/**
 * ThreatMonitoringZone — Phase 3 + Hardening
 * Coordinates read from selectedLake.coordinates (no hardcoding).
 * riskScore clamped to [0, 100] before use in progress bar.
 * aria-labels added to all status indicators.
 */

import { motion } from 'framer-motion';
import useLakeStore from '../store/useLakeStore';
import AlertStatus from './AlertStatus';

const CONTOUR_SIZES = [88, 68, 50, 32, 16];

function ThreatMonitoringZone() {
  const selectedLake  = useLakeStore(s => s.selectedLake);
  const riskScore     = useLakeStore(s => s.riskScore);
  const riskTier      = useLakeStore(s => s.riskTier);
  const analysisState = useLakeStore(s => s.analysisState);

  /* Clamp score — prevents bar overflow on bad data */
  const safeScore = Math.min(Math.max(riskScore, 0), 100);

  const tierLower  = riskTier.toLowerCase();
  const isScanning = analysisState === 'loading';

  /* Coordinates from data layer — no hardcoding */
  const { lat, lng, elevation } = selectedLake.coordinates ?? {
    lat: 'N/A', lng: 'N/A', elevation: 'N/A',
  };

  return (
    <div className="tmz">

      {/* ── Top bar ───────────────────────────────── */}
      <div className="tmz-topbar">
        <span className="tmz-topbar__title">Threat Monitoring Zone</span>
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

      {/* ── Terrain frame ─────────────────────────── */}
      <div
        className="tmz-frame"
        role="img"
        aria-label={`Simulated terrain view of ${selectedLake.name} with radar sweep`}
      >
        <div className="tmz-grid" aria-hidden="true" />

        {CONTOUR_SIZES.map((size, i) => (
          <div
            key={i}
            className="tmz-contour"
            aria-hidden="true"
            style={{ width: `${size}%`, height: `${size * 0.65}%` }}
          />
        ))}

        <div className="tmz-radar" aria-hidden="true">
          <motion.div
            className="tmz-radar-sweep"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: 'center center' }}
          >
            <div className="tmz-radar-arm" />
          </motion.div>
        </div>

        <motion.div
          className="tmz-scan-line"
          aria-hidden="true"
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
        />

        <div className="tmz-crosshair" aria-hidden="true" />

        <div className="tmz-frame-labels" aria-hidden="true">
          <span className="tmz-frame-labels__name">
            {selectedLake.name.toUpperCase()}
          </span>
          <span className="tmz-frame-labels__elv">ELV {elevation}</span>
        </div>
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
