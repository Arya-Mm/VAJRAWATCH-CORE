function ImpactPanel({ impact }) {
  return (
    <div>
      <h2>Impact Zone</h2>

      <p>Population: {impact.population}</p>

      <p>Hydropower: {impact.hydropowerMW} MW</p>

      <p>Historical Analog: {impact.historicalAnalog}</p>
    </div>
  );
}

export default ImpactPanel;
