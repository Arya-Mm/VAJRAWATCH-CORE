/**
 * AgentActivityPanel — Phase 3 + Hardening
 * PERFORMANCE: removed 5 individual AnimatePresence instances.
 * Status labels now transition via CSS `transition: color 0.18s ease`.
 * Zero Framer Motion overhead — no 10 simultaneous VDOM animations.
 * Icon suffix provides non-colour redundancy for colour-blind users.
 */

import useLakeStore from '../store/useLakeStore';

const AGENTS = [
  { id: 'sentinel', name: 'Sentinel Agent',     role: 'Anomaly detection'     },
  { id: 'env',      name: 'Environmental Agent', role: 'Weather analysis'      },
  { id: 'risk',     name: 'Risk Agent',          role: 'GLOF probability'      },
  { id: 'skeptic',  name: 'Skeptic Agent',       role: 'False positive filter' },
  { id: 'decision', name: 'Decision Agent',      role: 'Alert routing'         },
];

const STATE_STATUSES = {
  idle:     ['MONITORING', 'MONITORING', 'STANDBY',    'STANDBY',    'STANDBY'   ],
  loading:  ['SCANNING',   'ANALYZING',  'COMPUTING',  'VALIDATING', 'STANDBY'   ],
  critical: ['CONFIRMED',  'ANOMALY',    'HIGH CONF',  'VALIDATED',  'ESCALATED' ],
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

/* Non-colour icon per semantic bucket */
const STATUS_ICON = {
  green:  '●',
  yellow: '◐',
  red:    '▲',
  muted:  '○',
};

function AgentActivityPanel() {
  const analysisState = useLakeStore(s => s.analysisState);
  const statuses = STATE_STATUSES[analysisState] ?? STATE_STATUSES.idle;

  return (
    <div className="agent-panel" role="list" aria-label="Intelligence agent status">
      <p className="section-label">Agent Activity</p>

      <div className="agent-list">
        {AGENTS.map((agent, i) => {
          const status = statuses[i];
          const cls    = STATUS_CLS[status] ?? 'muted';
          const icon   = STATUS_ICON[cls]   ?? '○';

          return (
            <div
              key={agent.id}
              className="agent-item"
              role="listitem"
              aria-label={`${agent.name}: ${status}`}
            >
              {/* Colour dot — aria-hidden, icon handles non-colour signal */}
              <div
                className={`agent-item__dot agent-item__dot--${cls}`}
                aria-hidden="true"
              />
              <div className="agent-item__info">
                <span className="agent-item__name">{agent.name}</span>
                <span className="agent-item__role">{agent.role}</span>
              </div>
              {/* CSS transition handles colour change — no AnimatePresence */}
              <span
                className={`agent-item__status agent-item__status--${cls}`}
                aria-label={`Status: ${status}`}
              >
                <span className="agent-item__status-icon" aria-hidden="true">
                  {icon}
                </span>
                {status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AgentActivityPanel;
