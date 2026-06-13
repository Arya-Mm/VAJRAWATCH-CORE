function formatValue(value, suffix = '') {
  if (value == null || value === '') return 'No Data';
  if (typeof value === 'number') return `${value.toLocaleString()}${suffix}`;
  return `${value}${suffix}`;
}

export default function ImpactPanel({ impact, analysisState }) {
  const hasImpact = analysisState === 'complete' && impact;

  return (
    <section className="sidebar-section">
      <div className="section-heading">Impact</div>
      {!hasImpact && (
        <div className="empty-state">
          <span className="empty-state__title">
            {analysisState === 'offline' ? 'Backend Offline' : 'No Data Available'}
          </span>
          <span className="empty-state__body">
            {analysisState === 'awaiting' ? 'Awaiting Analysis' : 'Impact model did not return exposure data.'}
          </span>
        </div>
      )}
      {hasImpact && (
        <div className="impact-grid">
          <div className="impact-item">
            <span className="impact-item__label">Population</span>
            <span className="impact-item__value">{formatValue(impact.population)}</span>
          </div>
          <div className="impact-item">
            <span className="impact-item__label">Hydropower</span>
            <span className="impact-item__value">{formatValue(impact.hydropowerMW, ' MW')}</span>
          </div>
          <div className="impact-item impact-item--wide">
            <span className="impact-item__label">Reference</span>
            <span className="impact-item__value">{formatValue(impact.historicalAnalog)}</span>
          </div>
        </div>
      )}
    </section>
  );
}
