/**
 * AgentActivityPanel — Phase 3
 * 5 mocked intelligence agents with state-driven status labels.
 * No backend — all derived from analysisState in useLakeStore.
 */

import { motion, AnimatePresence } from 'framer-motion';
import useLakeStore from '../store/useLakeStore';

const AGENTS = [
  { id: 'sentinel', name: 'Sentinel Agent',     role: 'Anomaly detection'      },
  { id: 'env',      name: 'Environmental Agent', role: 'Weather analysis'       },
  { id: 'risk',     name: 'Risk Agent',          role: 'GLOF probability'       },
  { id: 'skeptic',  name: 'Skeptic Agent',       role: 'False positive filter'  },
  { id: 'decision', name: 'Decision Agent',      role: 'Alert routing'          },
];

const STATE_STATUSES = {
  idle:     ['MONITORING', 'MONITORING', 'STANDBY',    'STANDBY',   'STANDBY'   ],
  loading:  ['SCANNING',   'ANALYZING',  'COMPUTING',  'VALIDATING', 'STANDBY'  ],
  critical: ['CONFIRMED',  'ANOMALY',    'HIGH CONF',  'VALIDATED', 'ESCALATED' ],
};

const STATUS_CLS = {
  MONITORING: 'green',
  CONFIRMED:  'green',
  VALIDATED:  'green',
  SCANNING:   'yellow',
  ANALYZING:  'yellow',
  COMPUTING:  'yellow',
  VALIDATING: 'yellow',
  STANDBY:    'muted',
  ANOMALY:    'red',
  'HIGH CONF':'red',
  ESCALATED:  'red',
};

function AgentActivityPanel() {
  const analysisState = useLakeStore(s => s.analysisState);
  const statuses = STATE_STATUSES[analysisState] ?? STATE_STATUSES.idle;

  return (
    <div className="agent-panel">
      <p className="section-label">Agent Activity</p>

      <div className="agent-list">
        {AGENTS.map((agent, i) => {
          const status = statuses[i];
          const cls    = STATUS_CLS[status] ?? 'muted';

          return (
            <div key={agent.id} className="agent-item">
              <div className={`agent-item__dot agent-item__dot--${cls}`} aria-hidden="true" />
              <div className="agent-item__info">
                <span className="agent-item__name">{agent.name}</span>
                <span className="agent-item__role">{agent.role}</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.span
                  key={`${agent.id}-${status}`}
                  className={`agent-item__status agent-item__status--${cls}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {status}
                </motion.span>
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AgentActivityPanel;
