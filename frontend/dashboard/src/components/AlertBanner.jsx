/**
 * AlertBanner — Phase 4 (Peak-End Rule)
 * Full-width banner shown when analysisState === 'critical'.
 * Stays visible until next Run Analysis (no auto-dismiss).
 * Animated entry via Framer Motion height + opacity.
 */

import { motion } from 'framer-motion';
import useLakeStore from '../store/useLakeStore';

function AlertBanner() {
  const selectedLake = useLakeStore(s => s.selectedLake);
  const riskScore    = useLakeStore(s => s.riskScore);

  return (
    <motion.div
      className="alert-banner"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
      style={{ overflow: 'hidden' }}
      role="alert"
      aria-live="assertive"
    >
      <div className="alert-banner__inner">

        <span className="alert-banner__lake">
          {selectedLake.name.toUpperCase()}
        </span>

        <span className="alert-banner__sep" aria-hidden="true">·</span>

        <span className="alert-banner__score">
          RISK SCORE: {riskScore}
        </span>

        <span className="alert-banner__sep" aria-hidden="true">·</span>

        {/* Pulse on the RED ALERT label only */}
        <motion.span
          className="alert-banner__tier"
          animate={{ opacity: [1, 0.40, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
          aria-label="Red Alert Active"
        >
          ● RED ALERT ACTIVE
        </motion.span>

      </div>
    </motion.div>
  );
}

export default AlertBanner;
