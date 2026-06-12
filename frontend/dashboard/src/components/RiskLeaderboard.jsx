import useLakeStore from '../store/useLakeStore';

export default function RiskLeaderboard() {
  const lakesList = useLakeStore((s) => s.lakesList);
  const selectedLakeId = useLakeStore((s) => s.selectedLakeId);
  const selectLake = useLakeStore((s) => s.selectLake);

  // Sort lakes descending by riskScore
  const sortedLakes = [...lakesList].sort((a, b) => b.riskScore - a.riskScore);

  return (
    <div className="risk-leaderboard">
      <h3 className="leaderboard-title">RISK LEADERBOARD</h3>
      <div className="leaderboard-list">
        {sortedLakes.map((lake, index) => {
          const isSelected = lake.lakeId === selectedLakeId;
          const tierLower = lake.riskTier.toLowerCase();
          return (
            <div
              key={lake.lakeId}
              className={`leaderboard-item ${isSelected ? 'is-selected' : ''}`}
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
              <span className="leaderboard-rank">#{index + 1}</span>
              <div className="leaderboard-info">
                <span className="leaderboard-name">{lake.name}</span>
                <span className="leaderboard-coords">{lake.coordinates.lat} · {lake.coordinates.lng}</span>
              </div>
              <div className="leaderboard-score-badge">
                <span className="leaderboard-score">{lake.riskScore}</span>
                <span className={`tier-badge tier-${tierLower}`}>{lake.riskTier}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
