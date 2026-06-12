/**
 * RiskGauge — Phase 4
 * Adds:
 *   - requestAnimationFrame count-up: 0 → score in 800 ms (ease-out quad)
 *     Arc fill and score number animate in unison.
 *   - AnimatePresence: skeleton ↔ data cross-fade (no hard snap)
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TIER_COLORS = {
  RED:    '#ef4444',
  ORANGE: '#f97316',
  YELLOW: '#eab308',
  GREEN:  '#22c55e',
};

const TIER_LABELS = {
  RED:    'Critical Risk',
  ORANGE: 'High Risk',
  YELLOW: 'Moderate Risk',
  GREEN:  'Low Risk',
};

const TIER_ORDER = { GREEN: 0, YELLOW: 1, ORANGE: 2, RED: 3 };

const CX = 110;
const CY = 100;
const R  = 85;
const SW = 14;
const START_ANG = 225;
const SWEEP_ANG = 270;

const toXY = (r, deg) => {
  const rad = (deg * Math.PI) / 180;
  return [CX + r * Math.sin(rad), CY - r * Math.cos(rad)];
};

const buildArc = (r, a1, a2) => {
  const sweep = ((a2 - a1) % 360 + 360) % 360;
  if (sweep === 0) return '';
  const [sx, sy] = toXY(r, a1);
  const [ex, ey] = toXY(r, a2);
  return `M${sx.toFixed(2)},${sy.toFixed(2)} A${r},${r} 0 ${sweep > 180 ? 1 : 0},1 ${ex.toFixed(2)},${ey.toFixed(2)}`;
};

const SCALE_SEGS = [
  { cls: 'green'  },
  { cls: 'yellow' },
  { cls: 'orange' },
  { cls: 'red'    },
];

/* ── Skeleton markup ──────────────────────────────────────────────────── */
function GaugeSkeleton() {
  return (
    <div className="risk-gauge">
      <p className="section-label">Risk Assessment</p>
      <div className="skeleton skeleton--gauge" />
      <div className="skeleton skeleton--badge" />
      <div className="skeleton skeleton--desc" />
      <div className="risk-scale" aria-hidden="true">
        {SCALE_SEGS.map(seg => (
          <div key={seg.cls} className="risk-scale__seg" style={{ background: 'var(--border)' }} />
        ))}
      </div>
    </div>
  );
}

/* ── Gauge markup — receives animated displayScore ─────────────────── */
function GaugeData({ displayScore, score, tier }) {
  const color     = TIER_COLORS[tier] ?? '#ef4444';
  const tierLabel = TIER_LABELS[tier] ?? 'Unknown';
  const tierIdx   = TIER_ORDER[tier]  ?? 3;

  const bgPath    = buildArc(R, START_ANG, START_ANG + SWEEP_ANG);
  const scoreEnd  = START_ANG + (Math.min(Math.max(displayScore, 0), 100) / 100) * SWEEP_ANG;
  const scorePath = displayScore > 0 ? buildArc(R, START_ANG, scoreEnd) : '';

  return (
    <div className="risk-gauge">
      <p className="section-label">Risk Assessment</p>

      <div className="risk-gauge__wrap">
        <svg
          className="risk-gauge__svg"
          viewBox="0 0 220 220"
          aria-label={`Risk score ${score} out of 100, tier ${tier}`}
        >
          <path
            d={bgPath}
            fill="none"
            stroke="rgba(51,65,85,0.6)"
            strokeWidth={SW}
            strokeLinecap="round"
          />
          {scorePath && (
            <path
              d={scorePath}
              fill="none"
              stroke={color}
              strokeWidth={SW + 8}
              strokeLinecap="round"
              opacity="0.12"
            />
          )}
          {scorePath && (
            <path
              d={scorePath}
              fill="none"
              stroke={color}
              strokeWidth={SW}
              strokeLinecap="round"
            />
          )}
        </svg>

        <div className="risk-gauge__center">
          <span className="risk-gauge__score">{displayScore}</span>
          <span className="risk-gauge__unit">/ 100</span>
        </div>
      </div>

      <div className={`risk-tier-badge risk-tier-badge--${tier.toLowerCase()}`}>
        <span className="risk-tier-dot" aria-hidden="true" />
        {tierLabel}
      </div>

      <p className="risk-gauge__desc">
        Elevated GLOF probability. 72-hour forecast window active.
      </p>

      <div className="risk-scale" aria-label="Risk severity scale">
        {SCALE_SEGS.map((seg, i) => (
          <div
            key={seg.cls}
            className={`risk-scale__seg risk-scale__seg--${seg.cls}${i <= tierIdx ? ' is-active' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Main export ──────────────────────────────────────────────────────── */
function RiskGauge({ score, tier, isLoading }) {
  const [displayScore, setDisplayScore] = useState(0);
  const rafRef = useRef(null);

  /* Count-up: fires when isLoading transitions false */
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    let timerId = null;

    if (isLoading) {
      timerId = setTimeout(() => setDisplayScore(0), 0);
      return () => {
        if (timerId) clearTimeout(timerId);
      };
    }

    const duration  = 800; // ms
    const startTime = performance.now();

    const frame = (now) => {
      const t      = Math.min((now - startTime) / duration, 1);
      const eased  = 1 - (1 - t) * (1 - t); // ease-out quadratic
      setDisplayScore(Math.round(eased * score));
      if (t < 1) rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [score, isLoading]);

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <GaugeSkeleton />
        </motion.div>
      ) : (
        <motion.div
          key="data"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <GaugeData displayScore={displayScore} score={score} tier={tier} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default RiskGauge;
