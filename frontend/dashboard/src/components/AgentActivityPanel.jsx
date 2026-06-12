import useLakeStore from '../store/useLakeStore';

export default function AgentActivityPanel() {
  const analysisState = useLakeStore((s) => s.analysisState);
  const agentData = useLakeStore((s) => s.agentData);

  const isIdle = analysisState === 'idle';
  const isLoading = analysisState === 'loading';

  return (
    <div className="agent-panel" role="region" aria-label="LangGraph agent trace activity">
      <p className="section-label">LangGraph Agent Activity Trace</p>

      <div className="agent-list">
        {/* Table Headers */}
        <div className="trace-header-row">
          <span className="trace-col-name">Agent</span>
          <span className="trace-col-time">Time</span>
          <span className="trace-col-decision">Decision / State</span>
          <span className="trace-col-conf">Conf</span>
        </div>

        {isIdle && (
          <div className="trace-standby">
            <span>Standby — Ready to capture execution trace</span>
          </div>
        )}

        {isLoading && (
          <div className="trace-scanning">
            <span className="trace-scan-text">Executing LangGraph trace orchestrator...</span>
          </div>
        )}

        {!isIdle && !isLoading && agentData.map((agent, i) => (
          <div
            key={i}
            className="trace-item-row"
            role="listitem"
            aria-label={`${agent.name} executed in ${agent.execTime} with decision ${agent.decision} and ${agent.confidence} confidence`}
          >
            <div className="trace-col-name">
              <span className="trace-dot active"></span>
              {agent.name}
            </div>
            <span className="trace-col-time">{agent.execTime}</span>
            <span className="trace-col-decision">{agent.decision}</span>
            <span className="trace-col-conf badge-red">{agent.confidence}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
