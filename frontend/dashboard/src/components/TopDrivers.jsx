/* ─────────────────────────────────────────────────────
 * TopDrivers
 * Ranked list of risk drivers with horizontal bar,
 * anomaly value, and impact-weight footer row.
 * ───────────────────────────────────────────────────── */

// Rank-ordered impact weights (%) used to size the bars.
// Derived from driver ranking — first driver always carries highest weight.
const RANK_WEIGHTS = [87, 63, 45, 32, 22];

function TopDrivers({ drivers }) {
  return (
    <div className="top-drivers">
      <div className="panel-label">TOP RISK DRIVERS</div>

      <div className="drivers-list">
        {drivers.map((driver, i) => {
          const weight = RANK_WEIGHTS[i] ?? 20;

          return (
            <div key={i} className="driver-item">
              {/* Header row: rank · feature · anomaly value */}
              <div className="driver-header">
                <span className="driver-rank">{i + 1}</span>
                <span className="driver-feature">{driver.feature}</span>
                <span className="driver-value">{driver.value}</span>
              </div>

              {/* Progress bar */}
              <div className="driver-bar-track">
                <div
                  className="driver-bar-fill"
                  style={{ width: `${weight}%` }}
                />
              </div>

              {/* Footer row: label · weight percentage */}
              <div className="driver-footer">
                <span>IMPACT WEIGHT</span>
                <span>{weight}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TopDrivers;
