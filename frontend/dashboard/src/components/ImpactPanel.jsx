/**
 * ImpactPanel — Phase 4
 * Adds AnimatePresence skeleton ↔ data cross-fade.
 * Retains Phase 3 mission-control row layout (POP / HYD / REF codes).
 */

import { motion, AnimatePresence } from 'framer-motion';

function ImpactSkeleton() {
  return (
    <div className="impact-panel">
      <p className="section-label">Impact Severity</p>
      <div className="skeleton skeleton--impact" />
    </div>
  );
}

function ImpactData({ impact }) {
  const rows = [
    { code: 'POP', value: impact.population.toLocaleString(), label: 'People at risk'    },
    { code: 'HYD', value: `${impact.hydropowerMW} MW`,        label: 'Hydropower at risk' },
    { code: 'REF', value: impact.historicalAnalog,            label: 'Historical analog'  },
  ];

  return (
    <div className="impact-panel">
      <p className="section-label">Impact Severity</p>
      <div className="impact-severity">
        {rows.map(row => (
          <div key={row.code} className="impact-row">
            <span className="impact-row__code">{row.code}</span>
            <span className="impact-row__value">{row.value}</span>
            <span className="impact-row__label">{row.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImpactPanel({ impact, isLoading }) {
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
          <ImpactSkeleton />
        </motion.div>
      ) : (
        <motion.div
          key="data"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <ImpactData impact={impact} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ImpactPanel;
