const TIER_LABELS = {
  RED: 'Critical',
  ORANGE: 'High',
  YELLOW: 'Moderate',
  GREEN: 'Low',
};

function EmptyRisk({ state }) {
  const label = state === 'offline' ? 'Backend Offline' : 'Awaiting Analysis';
  const detail = state === 'offline'
    ? 'Risk model did not return a result.'
    : 'Run analysis to retrieve current risk.';

  return (
    <section className="sidebar-section risk-panel">
      <div className="section-heading">Risk Score</div>
      <div className="empty-state">
        <span className="empty-state__title">{label}</span>
        <span className="empty-state__body">{detail}</span>
      </div>
    </section>
  );
}

export default function RiskGauge({ score, tier, analysisState }) {
  if (analysisState !== 'complete' || score == null || !tier) {
    return <EmptyRisk state={analysisState} />;
  }

  const clampedScore = Math.max(0, Math.min(100, Number(score)));
  const tierClass = tier.toLowerCase();

  return (
    <section className="sidebar-section risk-panel">
      <div className="section-heading">Risk Score</div>
      <div className="risk-panel__body">
        <div className="risk-panel__score">
          <span className="risk-panel__number">{clampedScore}</span>
          <span className="risk-panel__unit">/100</span>
        </div>
        <div className={`risk-panel__tier risk-panel__tier--${tierClass}`}>
          {TIER_LABELS[tier] ?? tier} Risk
        </div>
      </div>
      <div className="risk-meter" aria-hidden="true">
        <span style={{ width: `${clampedScore}%` }} className={`risk-meter__fill risk-meter__fill--${tierClass}`} />
      </div>
    </section>
  );
}
