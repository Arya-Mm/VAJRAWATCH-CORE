import { useEffect, useState } from 'react';
import useLakeStore from '../store/useLakeStore';
import { playWarningAudio } from '../services/audioApi';

const ACTION_MAP = {
  RED: {
    status: 'RED ALERT — CRITICAL GLOF THREAT',
    action: 'Evacuate downstream valley settlements immediately',
    next: 'Broadcast warning audio & notify district response units',
  },
  ORANGE: {
    status: 'ORANGE WATCH — HIGH RISK',
    action: 'Stage emergency rescue assets downstream',
    next: 'Alert hydropower stations & coordinate logistics',
  },
  YELLOW: {
    status: 'YELLOW ADVISORY — MODERATE RISK',
    action: 'Verify sensor alignments and log visual scans',
    next: 'Standard monitoring protocols active',
  },
  GREEN: {
    status: 'GREEN NOMINAL — SYSTEM CALM',
    action: 'No immediate evacuations or actions required',
    next: 'Routine background satellite telemetry surveillance',
  },
};

const PIPELINE_STEPS = [
  { code: 'SAT', label: 'Sat Scan' },
  { code: 'WTH', label: 'Weather' },
  { code: 'SIS', label: 'Seismic' },
  { code: 'RSK', label: 'Risk' },
  { code: 'ALT', label: 'Alert' },
];

export default function AlertConsole() {
  const analysisState = useLakeStore((s) => s.analysisState);
  const riskTier = useLakeStore((s) => s.riskTier);
  const evidence = useLakeStore((s) => s.evidence);
  const reasoning = useLakeStore((s) => s.reasoning);
  const decisionLogs = useLakeStore((s) => s.decisionLogs);

  const isIdle = analysisState === 'idle';
  const isLoading = analysisState === 'loading';

  const tierLower = riskTier ? riskTier.toLowerCase() : 'green';

  const [activeStep, setActiveStep] = useState(-1);

  useEffect(() => {
    const timers = [];
    if (analysisState === 'loading') {
      timers.push(setTimeout(() => setActiveStep(0), 0));
      timers.push(setTimeout(() => setActiveStep(1), 300));
      timers.push(setTimeout(() => setActiveStep(2), 600));
      timers.push(setTimeout(() => setActiveStep(3), 900));
      timers.push(setTimeout(() => setActiveStep(4), 1200));
    } else if (analysisState === 'critical') {
      timers.push(setTimeout(() => setActiveStep(5), 0));
    } else {
      timers.push(setTimeout(() => setActiveStep(-1), 0));
    }
    return () => timers.forEach(clearTimeout);
  }, [analysisState]);

  // Determine current action text
  let actionInfo = ACTION_MAP[riskTier] || ACTION_MAP.GREEN;
  if (isLoading) {
    actionInfo = {
      status: 'SYSTEM ANALYSIS IN PROGRESS...',
      action: 'Aggregating satellite, weather, and seismic telemetry',
      next: 'Awaiting multi-agent consensus decisions',
    };
  }

  return (
    <div className="alert-console" role="region" aria-label="Intelligence Console">
      <div className="console-header">
        <div className="console-header__left">
          <span className="console-dot-glow"></span>
          <span className="console-title">INTELLIGENCE & OPERATIONS CONSOLE</span>
        </div>
        {/* Horizontal Pipeline Steps */}
        <div className="console-pipeline">
          {PIPELINE_STEPS.map((step, idx) => {
            const isDone = activeStep > idx;
            const isActive = activeStep === idx;
            const stateCls = isDone ? 'done' : isActive ? 'active' : 'pending';
            return (
              <div key={step.code} className={`console-step console-step--${stateCls}`} title={step.label}>
                <span className="step-marker">{isDone ? '✓' : isActive ? '●' : '○'}</span>
                <span className="step-code">{step.code}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="console-body">
        {/* Left Column: Recommended Actions */}
        <div className="console-left-panel">
          <div className={`op-status-block status-theme--${isLoading ? 'loading' : tierLower}`}>
            <div className="op-status-hdr">OPERATIONAL RECOMMENDED ACTION</div>
            <div className="op-status-row">
              <span className="op-status-label">STATUS:</span>
              <span className="op-status-val status-text">{actionInfo.status}</span>
            </div>
            <div className="op-status-row">
              <span className="op-status-label">ACTION:</span>
              <span className="op-status-val">{actionInfo.action}</span>
            </div>
            <div className="op-status-row">
              <span className="op-status-label">NEXT:</span>
              <span className="op-status-val">{actionInfo.next}</span>
            </div>
          </div>

          <div className="op-actions-row">
            <button
              type="button"
              className="audio-warning-btn"
              onClick={playWarningAudio}
              disabled={isLoading || isIdle}
              aria-label="Play GLOF emergency voice broadcast warning"
            >
              ▶ BROADCAST WARNING
            </button>
          </div>
        </div>

        {/* Right Column: Reasoning & Trace Logs */}
        <div className="console-right-panel">
          {isIdle && (
            <div className="console-standby">
              <span className="blink-text">&gt; SYSTEM STANDBY: Ready for intelligence scan...</span>
            </div>
          )}

          {isLoading && (
            <div className="console-loading">
              <span className="loader-text">&gt; RUNNING LANGGRAPH AGENT ORCHESTRATION...</span>
              <div className="agent-scan-nodes">
                <span className="scan-node active">Sentinel</span>
                <span className="scan-node active">Env</span>
                <span className="scan-node active">Risk</span>
                <span className="scan-node active">Skeptic</span>
                <span className="scan-node active">Decision</span>
              </div>
            </div>
          )}

          {!isIdle && !isLoading && (
            <div className="console-data-content">
              <div className="console-text-block">
                <span className="console-text-hdr">EVIDENCE:</span>
                <span className="console-text-body">{evidence}</span>
              </div>
              <div className="console-text-block">
                <span className="console-text-hdr">REASONING:</span>
                <span className="console-text-body">{reasoning}</span>
              </div>
              <div className="console-logs-block">
                <span className="console-text-hdr">TRACE LOGS:</span>
                <div className="log-window">
                  {decisionLogs.map((log, i) => (
                    <div key={i} className="log-line">
                      <span className="log-time">[{log.time}]</span>
                      <span className="log-msg">{log.message || log.msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
