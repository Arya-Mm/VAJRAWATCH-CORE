import useLakeStore from '../store/useLakeStore';
import { playWarningAudio } from '../services/audioApi';

export default function AlertConsole() {
  const analysisState = useLakeStore((s) => s.analysisState);
  const evidence = useLakeStore((s) => s.evidence);
  const reasoning = useLakeStore((s) => s.reasoning);
  const decisionLogs = useLakeStore((s) => s.decisionLogs);

  const isIdle = analysisState === 'idle';
  const isLoading = analysisState === 'loading';

  return (
    <div className="alert-console" role="region" aria-label="Intelligence Console">
      <div className="console-header">
        <span className="console-dot-glow"></span>
        <span className="console-title">AGENT DECISION CONSOLE</span>
      </div>

      <div className="console-body">
        {isIdle && (
          <div className="console-standby">
            <span className="blink-text">&gt; SYSTEM STANDBY: Ready for intelligence scan...</span>
          </div>
        )}

        {isLoading && (
          <div className="console-loading">
            <span className="loader-text">&gt; SCANNING LANGGRAPH AGENT ORCHESTRATION...</span>
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
          <div className="console-data-grid">
            {/* Left Column: Evidence & Reasoning */}
            <div className="console-col col-left">
              <div className="console-section">
                <span className="section-hdr">RISK EVIDENCE</span>
                <p className="evidence-text">{evidence}</p>
              </div>
              <div className="console-section">
                <span className="section-hdr">AGENT REASONING</span>
                <p className="reasoning-text">{reasoning}</p>
              </div>
            </div>

            {/* Right Column: Decision Trace Logs */}
            <div className="console-col col-right">
              <span className="section-hdr">DECISION FLOW LOGS</span>
              <div className="log-window">
                {decisionLogs.map((log, i) => (
                  <div key={i} className="log-line">
                    <span className="log-time">[{log.time}]</span>
                    <span className="log-msg">{log.message || log.msg}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning Audio Play HUD */}
            <div className="console-audio-action">
              <button
                type="button"
                className="audio-warning-btn"
                onClick={playWarningAudio}
                aria-label="Play GLOF emergency voice broadcast warning"
              >
                ▶ PLAY WARNING AUDIO
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
