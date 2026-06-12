import useLakeStore from '../store/useLakeStore';

export default function CrossLakeComparison() {
  const lakesList = useLakeStore((s) => s.lakesList);
  const selectedLakeId = useLakeStore((s) => s.selectedLakeId);
  const selectLake = useLakeStore((s) => s.selectLake);

  // Sort lakes descending by riskScore to function as an active leaderboard registry
  const sortedLakes = [...lakesList].sort((a, b) => b.riskScore - a.riskScore);

  return (
    <div className="cross-lake-comparison">
      <h3 className="comparison-title">ACTIVE LAKE REGISTRY</h3>
      <div className="comparison-table-wrapper">
        <table className="comparison-table">
          <thead>
            <tr>
              <th className="text-center">RANK</th>
              <th>LAKE</th>
              <th className="text-center">RISK</th>
              <th className="text-center">GROWTH</th>
              <th className="text-center">TREND</th>
              <th className="text-right">POPULATION</th>
              <th className="text-right">HYDRO CAPACITY</th>
            </tr>
          </thead>
          <tbody>
            {sortedLakes.map((lake, index) => {
              const isSelected = lake.lakeId === selectedLakeId;
              const tierLower = lake.riskTier.toLowerCase();
              return (
                <tr
                  key={lake.lakeId}
                  className={`comparison-row ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => selectLake(lake.lakeId)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${lake.name}, Risk Score ${lake.riskScore}, Tier ${lake.riskTier}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      selectLake(lake.lakeId);
                    }
                  }}
                >
                  <td className="text-center font-mono font-bold" style={{ color: 'var(--text-3)' }}>
                    #{index + 1}
                  </td>
                  <td className="lake-name-cell">
                    <span className={`status-dot tier-${tierLower}`} />
                    {lake.name}
                  </td>
                  <td className={`text-center font-bold text-${tierLower}`}>
                    {lake.riskScore}
                  </td>
                  <td className="text-center">{lake.growth}</td>
                  <td className="text-center trend-cell">{lake.trend}</td>
                  <td className="text-right">{lake.impact?.population?.toLocaleString()}</td>
                  <td className="text-right">{lake.impact?.hydropowerMW} MW</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
