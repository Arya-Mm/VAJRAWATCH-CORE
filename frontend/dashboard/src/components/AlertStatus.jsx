/**
 * AlertStatus
 * Reads analysisState + lastAnalysisAt from useLakeStore.
 * No props — fully self-contained.
 * Shows: Monitoring (idle) | Analyzing (loading) | Critical Alert (critical)
 */

import useLakeStore, { formatRelativeTime } from '../store/useLakeStore';

const STATUS_CONFIG = {
  idle:     { label: 'Monitoring',     cls: 'green'  },
  loading:  { label: 'Analyzing',      cls: 'yellow' },
  critical: { label: 'Critical Alert', cls: 'red'    },
};

function AlertStatus() {
  const analysisState  = useLakeStore(s => s.analysisState);
  const lastAnalysisAt = useLakeStore(s => s.lastAnalysisAt);
  const config = STATUS_CONFIG[analysisState] ?? STATUS_CONFIG.idle;

  return (
    <div className="alert-status">
      <div className={`alert-status__badge alert-status__badge--${config.cls}`}>
        <span className="alert-status__dot" aria-hidden="true" />
        {config.label}
      </div>
      <p className="alert-status__timestamp">
        Last Analysis: {formatRelativeTime(lastAnalysisAt)}
      </p>
    </div>
  );
}

export default AlertStatus;
