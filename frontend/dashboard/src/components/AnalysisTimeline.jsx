/**
 * AnalysisTimeline — Phase 3
 * Shows the 5-step analysis pipeline.
 * Steps activate progressively during 'loading' state (300ms stagger).
 * All COMPLETE when 'critical'. All PENDING when 'idle'.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useLakeStore from '../store/useLakeStore';

const STEPS = [
  { code: 'SAT', label: 'Satellite Scan'   },
  { code: 'WTH', label: 'Weather Analysis' },
  { code: 'SIS', label: 'Seismic Analysis' },
  { code: 'RSK', label: 'Risk Assessment'  },
  { code: 'ALT', label: 'Alert Generated'  },
];

const STEP_DELAYS = [0, 300, 600, 900, 1200]; // ms within 1500ms window

function getStatus(stepIdx, activeStep) {
  if (activeStep === -1) return 'pending';
  if (stepIdx < activeStep) return 'complete';
  if (stepIdx === activeStep) return 'active';
  return 'pending';
}

const STATUS_LABELS = {
  pending:  'PENDING',
  active:   'ACTIVE',
  complete: 'COMPLETE',
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
      timers.push(setTimeout(() => setActiveStep(STEPS.length), 0));
    } else {
      timers.push(setTimeout(() => setActiveStep(-1), 0));
    }

    return () => timers.forEach(clearTimeout);
  }, [analysisState]);

  return (
    <div className="analysis-timeline">
      <p className="section-label">Analysis Pipeline</p>

      <div className="timeline-steps">
        {STEPS.map((step, i) => {
          const status = getStatus(i, activeStep);

          return (
            <div key={step.code} className="timeline-row">

              {/* Step */}
              <div className={`timeline-step timeline-step--${status}`}>
                <div className="timeline-step__marker" aria-hidden="true">
                  {status === 'complete' ? '✓' : status === 'active' ? '▸' : '○'}
                </div>
                <span className="timeline-step__code">{step.code}</span>
                <span className="timeline-step__label">{step.label}</span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={status}
                    className={`timeline-step__status timeline-step__status--${status}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {STATUS_LABELS[status]}
                  </motion.span>
                </AnimatePresence>
              </div>

              {/* Connector between steps */}
              {i < STEPS.length - 1 && (
                <div className="timeline-connector">
                  <motion.div
                    className="timeline-connector__fill"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: activeStep > i ? 1 : 0 }}
                    transition={{ duration: 0.25 }}
                    style={{ transformOrigin: 'top' }}
                  />
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
