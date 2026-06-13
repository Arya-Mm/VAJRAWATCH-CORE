function DriversEmpty({ analysisState }) {
  const title = analysisState === 'offline' ? 'Backend Offline' : 'No Data Available';
  const body = analysisState === 'awaiting'
    ? 'Awaiting Analysis'
    : 'Driver attribution was not returned.';

  return (
    <div className="empty-state">
      <span className="empty-state__title">{title}</span>
      <span className="empty-state__body">{body}</span>
    </div>
  );
}

export default function TopDrivers({ drivers = [], analysisState }) {
  return (
    <section className="sidebar-section">
      <div className="section-heading">Top Drivers</div>
      {analysisState === 'loading' && (
        <div className="empty-state">
          <span className="empty-state__title">Awaiting Analysis</span>
          <span className="empty-state__body">Driver model is running.</span>
        </div>
      )}
      {analysisState !== 'loading' && drivers.length === 0 && (
        <DriversEmpty analysisState={analysisState} />
      )}
      {analysisState !== 'loading' && drivers.length > 0 && (
        <div className="driver-list">
          {drivers.map((driver, index) => (
            <div key={`${driver.feature ?? driver.name}-${index}`} className="driver-row">
              <span className="driver-row__rank">{index + 1}</span>
              <span className="driver-row__name">{driver.feature ?? driver.name}</span>
              <span className="driver-row__value">{driver.value ?? driver.score ?? 'No Data'}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
