import useLakeStore from '../store/useLakeStore';

export default function CrossLakeComparison() {
  const lakesList = useLakeStore((s) => s.lakesList);
  const selectedLakeId = useLakeStore((s) => s.selectedLakeId);
  const selectLake = useLakeStore((s) => s.selectLake);

  return (
    <div className="cross-lake-comparison">
      <h3 className="comparison-title">CROSS-LAKE COMPARISON</h3>
      <div className="comparison-table-wrapper">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>LAKE</th>
              <th className="text-center">RISK</th>
              <th className="text-center">GROWTH</th>
              <th>TREND</th>
              <th className="text-right">POPULATION</th>
              <th className="text-right">HYDRO</th>
            </tr>
          </thead>
          <tbody>
            {lakesList.map((lake) => {
              const isSelected = lake.lakeId === selectedLakeId;
              const tierLower = lake.riskTier.toLowerCase();
              return (
                <tr
                  key={lake.lakeId}
                  className={`comparison-row ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => selectLake(lake.lakeId)}
                >
                  <td className="lake-name-cell">
                    <span className={`status-dot tier-${tierLower}`} />
                    {lake.name}
                  </td>
                  <td className={`text-center font-bold text-${tierLower}`}>
                    {lake.riskScore}
                  </td>
                  <td className="text-center">{lake.growth}</td>
                  <td className="trend-cell">{lake.trend}</td>
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
