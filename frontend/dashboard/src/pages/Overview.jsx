import useLakeStore, { getDisplayStatus, getSelectedLake } from '../store/useLakeStore';
import ThreatMonitoringZone from '../components/ThreatMonitoringZone';
import RiskGauge from '../components/RiskGauge';
import TopDrivers from '../components/TopDrivers';
import ImpactPanel from '../components/ImpactPanel';
import AlertConsole from '../components/AlertConsole';
import ErrorBoundary from '../components/ErrorBoundary';
import LakeSelector from '../components/LakeSelector';
import RunAnalysisButton from '../components/RunAnalysisButton';

function EmptyDrawerState({ label = 'No Data Available' }) {
  return <div className="drawer-empty">{label}</div>;
}

function CommandDrawer({ title, children }) {
  return (
    <details className="command-drawer">
      <summary>{title}</summary>
      <div className="command-drawer__body">{children}</div>
    </details>
  );
}

function LakeRegistry({ lakes }) {
  return (
    <div className="registry-list">
      {lakes.map((lake) => (
        <div key={lake.lakeId} className="registry-row">
          <span className="registry-row__name">{lake.name}</span>
          <span className="registry-row__meta">{lake.region}</span>
        </div>
      ))}
    </div>
  );
}

function LogList({ items }) {
  if (!items?.length) return <EmptyDrawerState />;

  return (
    <div className="log-list">
      {items.map((item, index) => (
        <div key={`${item.time ?? 'log'}-${index}`} className="log-list__row">
          <span className="log-list__time">{item.time ?? '--'}</span>
          <span className="log-list__text">{item.message ?? item.msg ?? String(item)}</span>
        </div>
      ))}
    </div>
  );
}

function AgentLogList({ agents }) {
  if (!agents?.length) return <EmptyDrawerState />;

  return (
    <div className="agent-log-list">
      {agents.map((agent, index) => (
        <div key={`${agent.name ?? 'agent'}-${index}`} className="agent-log-row">
          <span>{agent.name ?? 'Agent'}</span>
          <span>{agent.decision ?? agent.state ?? 'No Data'}</span>
        </div>
      ))}
    </div>
  );
}

function IntelligenceText({ result, analysisState }) {
  if (analysisState === 'offline') return <EmptyDrawerState label="Backend Offline" />;
  if (analysisState !== 'complete') return <EmptyDrawerState label="Awaiting Analysis" />;
  if (!result?.evidence && !result?.reasoning) return <EmptyDrawerState />;

  return (
    <div className="intelligence-text">
      {result.evidence && (
        <p>
          <span>Evidence</span>
          {result.evidence}
        </p>
      )}
      {result.reasoning && (
        <p>
          <span>Reasoning</span>
          {result.reasoning}
        </p>
      )}
    </div>
  );
}

function Overview() {
  const selectedLake = useLakeStore(getSelectedLake);
  const lakesList = useLakeStore((s) => s.lakesList);
  const analysisState = useLakeStore((s) => s.analysisState);
  const analysisResult = useLakeStore((s) => s.analysisResult);
  const systemStatus = useLakeStore(getDisplayStatus);

  return (
    <div className="eoc-shell">
      <header className="eoc-header">
        <div className="eoc-wordmark">VAJRAWATCH</div>
        <div className="eoc-header__items" aria-label="System summary">
          <span>System Status: {systemStatus}</span>
          <span>47 Lakes Monitored</span>
          <span>Regional Breakdown</span>
        </div>
      </header>

      <div className="eoc-body">
        <main className="eoc-map-panel">
          <ErrorBoundary>
            <ThreatMonitoringZone />
          </ErrorBoundary>
        </main>

        <aside className="eoc-sidebar" aria-label="Operations sidebar">
          <section className="sidebar-section selected-lake-card">
            <div className="section-heading">Selected Lake</div>
            <LakeSelector />
            <div className="selected-lake-meta">
              <span>{selectedLake.lakeId}</span>
              <span>{selectedLake.region}</span>
              <span>{selectedLake.coordinates.lat} / {selectedLake.coordinates.lng}</span>
              <span>Elevation {selectedLake.coordinates.elevation}</span>
            </div>
          </section>

          <ErrorBoundary>
            <RiskGauge
              score={analysisResult?.riskScore}
              tier={analysisResult?.riskTier}
              analysisState={analysisState}
            />
          </ErrorBoundary>

          <ErrorBoundary>
            <TopDrivers drivers={analysisResult?.topDrivers} analysisState={analysisState} />
          </ErrorBoundary>

          <ErrorBoundary>
            <ImpactPanel impact={analysisResult?.impact} analysisState={analysisState} />
          </ErrorBoundary>

          <ErrorBoundary>
            <AlertConsole
              analysisState={analysisState}
              recommendedAction={analysisResult?.recommendedAction}
            />
          </ErrorBoundary>

          <section className="sidebar-section run-analysis-card">
            <div className="section-heading">Run Analysis</div>
            <RunAnalysisButton />
          </section>

          <section className="drawer-stack" aria-label="Collapsed intelligence drawers">
            <CommandDrawer title="System Intelligence">
              <IntelligenceText result={analysisResult} analysisState={analysisState} />
            </CommandDrawer>
            <CommandDrawer title="Lake Registry">
              <LakeRegistry lakes={lakesList} />
            </CommandDrawer>
            <CommandDrawer title="Timeline">
              {analysisState === 'loading' ? <EmptyDrawerState label="Awaiting Analysis" /> : <LogList items={analysisResult?.decisionLogs} />}
            </CommandDrawer>
            <CommandDrawer title="Agent Logs">
              <AgentLogList agents={analysisResult?.agents} />
            </CommandDrawer>
            <CommandDrawer title="Trace Logs">
              <LogList items={analysisResult?.decisionLogs} />
            </CommandDrawer>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default Overview;
