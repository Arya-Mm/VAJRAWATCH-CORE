/**
 * AnalysisTimeline — LangGraph Agent Pipeline
 * Displays the 5-agent AI analysis chain.
 * Agents activate progressively during 'loading' state (300 ms stagger).
 * All COMPLETE when backend returns data. All PENDING when idle.
 *
 * Honest framing: this visualises the agent orchestration pipeline.
 * It does NOT generate or display risk values — those come from the backend.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useLakeStore from '../store/useLakeStore';

const AGENTS = [
  {
    code:     'SAT',
    name:     'Satellite Agent',
    role:     'Image ingestion · Lake area Δ detection',
    icon:     '🛰️',
  },
  {
    code:     'WTH',
    name:     'Weather Agent',
    role:     'Precipitation · Temperature anomaly',
    icon:     '🌦️',
  },
  {
    code:     'HYD',
    name:     'Hydrology Agent',
    role:     'Ice-melt flux · Water volume estimate',
    icon:     '💧',
  },
  {
    code:     'RSK',
    name:     'Risk Fusion Agent',
    role:     'Multi-factor scoring · Confidence weighting',
    icon:     '⚡',
  },
  {
    code:     'ALT',
    name:     'Alert Generator',
    role:     'Tier dispatch · Action recommendation',
    icon:     '🚨',
  },
];

const STEP_DELAYS = [0, 300, 600, 900, 1200]; // ms within 1500 ms window

function getStatus(agentIdx, activeStep) {
  if (activeStep === -1) return 'pending';
  if (agentIdx < activeStep) return 'complete';
  if (agentIdx === activeStep) return 'active';
  return 'pending';
}

const STATUS_LABELS = {
  pending:  'PENDING',
  active:   'RUNNING',
  complete: 'DONE',
};

function AnalysisTimeline() {
  const analysisState = useLakeStore(s => s.analysisState);
  const [activeStep, setActiveStep] = useState(-1);

  useEffect(() => {
    const timers = [];

    if (analysisState === 'loading') {
      timers.push(setTimeout(() => setActiveStep(0), 0));
      STEP_DELAYS.slice(1).forEach((delay, i) => {
        timers.push(setTimeout(() => setActiveStep(i + 1), delay));
      });
    } else if (analysisState === 'critical') {
      timers.push(setTimeout(() => setActiveStep(AGENTS.length), 0));
    } else {
      timers.push(setTimeout(() => setActiveStep(-1), 0));
    }

    return () => timers.forEach(clearTimeout);
  }, [analysisState]);

  return (
    <div className="analysis-timeline">
      <p className="section-label">LangGraph Agent Pipeline</p>

      <div className="timeline-steps">
        {AGENTS.map((agent, i) => {
          const status = getStatus(i, activeStep);

          return (
            <div key={agent.code} className="timeline-row">

              {/* Agent Step */}
              <div className={`timeline-step timeline-step--${status}`}>

                {/* Icon + marker */}
                <div className="timeline-step__marker" aria-hidden="true">
                  {status === 'complete'
                    ? '✓'
                    : status === 'active'
                    ? <span className="pulse-dot" />
                    : '○'}
                </div>

                {/* Agent info */}
                <div className="timeline-step__info">
                  <div className="timeline-step__header">
                    <span className="timeline-step__icon" aria-hidden="true">{agent.icon}</span>
                    <span className="timeline-step__name">{agent.name}</span>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={status}
                        className={`timeline-step__status timeline-step__status--${status}`}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.18 }}
                      >
                        {STATUS_LABELS[status]}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  <span className="timeline-step__role">{agent.role}</span>
                </div>

              </div>

              {/* Animated arrow connector between agents */}
              {i < AGENTS.length - 1 && (
                <div className="timeline-connector" aria-hidden="true">
                  <motion.div
                    className="timeline-connector__fill"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: activeStep > i ? 1 : 0 }}
                    transition={{ duration: 0.22 }}
                    style={{ transformOrigin: 'top' }}
                  />
                  <span className="timeline-connector__arrow">↓</span>
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AnalysisTimeline;
