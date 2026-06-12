/**
 * ThreatMonitoringZone — Phase 3
 * Hero panel: lake info + AlertStatus + animated terrain frame.
 * Reads from useLakeStore — no props needed.
 * Framer Motion: radar sweep · scan line · status dot pulse.
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

  const tierLower  = riskTier.toLowerCase();
  const isScanning = analysisState === 'loading';

  return (
    <div className="tmz">

      {/* ── Top bar ───────────────────────────────── */}
      <div className="tmz-topbar">
        <span className="tmz-topbar__title">Threat Monitoring Zone</span>
        <div className="tmz-topbar__status">
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
          <span>28.5143°N · 84.4231°E</span>
        </div>

        <div className={`tier-status tier-status--${tierLower}`}>
          <span className="tier-status__dot" aria-hidden="true" />
          {riskTier} — Critical Alert Active
        </div>

        <AlertStatus />
      </div>

      {/* ── Terrain frame ─────────────────────────── */}
      <div className="tmz-frame" role="img" aria-label="Simulated terrain view with radar sweep">

        {/* Grid overlay */}
        <div className="tmz-grid" aria-hidden="true" />

        {/* Terrain contour rings */}
        {CONTOUR_SIZES.map((size, i) => (
          <div
            key={i}
            className="tmz-contour"
            aria-hidden="true"
            style={{ width: `${size}%`, height: `${size * 0.65}%` }}
          />
        ))}

        {/* Radar sweep container */}
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

        {/* Scan line */}
        <motion.div
          className="tmz-scan-line"
          aria-hidden="true"
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
        />

        {/* Crosshair */}
        <div className="tmz-crosshair" aria-hidden="true" />

        {/* Frame corner labels */}
        <div className="tmz-frame-labels" aria-hidden="true">
          <span className="tmz-frame-labels__name">
            {selectedLake.name.toUpperCase()}
          </span>
          <span className="tmz-frame-labels__elv">ELV 4,149m</span>
        </div>
      </div>

      {/* ── Risk tier status bar ───────────────────── */}
      <div className={`tmz-status-bar tmz-status-bar--${tierLower}`}>
        <span className="tmz-status-bar__label">RISK TIER</span>
        <div className="tmz-status-bar__track" role="progressbar" aria-valuenow={riskScore} aria-valuemin={0} aria-valuemax={100}>
          <div className="tmz-status-bar__fill" style={{ width: `${riskScore}%` }} />
        </div>
        <span className="tmz-status-bar__score">{riskScore}/100</span>
        <span className="tmz-status-bar__tier">{riskTier}</span>
      </div>

    </div>
  );
}

export default ThreatMonitoringZone;
