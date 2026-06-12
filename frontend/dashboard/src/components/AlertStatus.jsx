/**
 * AlertStatus — Phase 2 + Hardening
 * Reactive timestamp: setInterval forces re-render every 30 s so
 * "2 minutes ago" advances correctly during a live demo.
 * role="status" + aria-live="polite" for screen-reader compatibility.
 */

import { useEffect, useReducer } from 'react';
import useLakeStore, { formatRelativeTime } from '../store/useLakeStore';

const STATUS_CONFIG = {
  idle:     { label: 'Monitoring',     cls: 'green',  icon: '●' },
  loading:  { label: 'Analyzing',      cls: 'yellow', icon: '◐' },
  critical: { label: 'Critical Alert', cls: 'red',    icon: '▲' },
};

function AlertStatus() {
  const analysisState  = useLakeStore(s => s.analysisState);
  const lastAnalysisAt = useLakeStore(s => s.lastAnalysisAt);
  const config = STATUS_CONFIG[analysisState] ?? STATUS_CONFIG.idle;

  /* Force re-render every 30 s so formatRelativeTime stays current */
  const [, tick] = useReducer(n => n + 1, 0);
  useEffect(() => {
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="alert-status"
      role="status"
      aria-live="polite"
      aria-label={`Monitoring status: ${config.label}`}
    >
      <div className={`alert-status__badge alert-status__badge--${config.cls}`}>
        {/* Icon provides non-colour redundancy for colour-blind users */}
        <span className="alert-status__dot" aria-hidden="true">
          {config.icon}
        </span>
        {config.label}
      </div>
      <p className="alert-status__timestamp">
        Last Analysis: {formatRelativeTime(lastAnalysisAt)}
      </p>
    </div>
  );
}

export default AlertStatus;
